from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import select, desc
from app.db import SessionDep
from app.dependencies import TokenDep
from app.utils.pdf_generator import render_pdf_from_template
from app.models import Invoice, InvoiceCreate, Provider, InvoiceCustomization
from app.models.invoice_customization import PageSizes
from app.routers.login import get_provider_current

router = APIRouter(tags=["invoices"])


@router.get("/invoices/", response_model=list[Invoice])
def get_invoices(session: SessionDep, token: TokenDep):
    return session.exec(select(Invoice)).all()


@router.post("/invoices/", response_model=Invoice, status_code=status.HTTP_201_CREATED)
def create_invoice(
    data: InvoiceCreate,
    session: SessionDep,
    token: TokenDep,
    provider: Provider = Depends(get_provider_current),
):
    invoice = Invoice.model_validate(data.model_dump())
    
    invoice.provider_id = provider.id

    if not invoice.invoice_number:
        last_invoice = session.exec(
            select(Invoice)
            .where(Invoice.provider_id == invoice.provider_id)
            .order_by(desc(Invoice.id))
        ).first()
        if last_invoice:
            last_number = int(last_invoice.id)
            new_number = last_number + 1
        else:
            new_number = 1

        invoice.invoice_number = f"{new_number:04d}"

    session.add(invoice)
    session.commit()
    session.refresh(invoice)
    return invoice


@router.get("/invoices/{invoice_id}", response_model=Invoice)
def get_invoice(invoice_id: int, session: SessionDep, token: TokenDep):
    invoice = session.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found"
        )
    return invoice

@router.get("/invoices/{invoice_id}/pdf/")
def get_invoice_pdf(invoice_id: int, session: SessionDep, provider: Provider = Depends(get_provider_current)):
    invoice = session.get(Invoice, invoice_id)
    services = invoice.service_account.services

    # Sort services by service_date chronologically (ascending)
    services = sorted(services, key=lambda s: s.service_date)

    # Look for account-specific customization first
    customization = session.exec(
        select(InvoiceCustomization)
        .where(InvoiceCustomization.provider_id == provider.id)
        .where(InvoiceCustomization.service_account_id == invoice.service_account_id)
        .where(InvoiceCustomization.apply_to_all_accounts == False)
    ).first()

    # Fallback to global customization
    if not customization:
        customization = session.exec(
            select(InvoiceCustomization)
            .where(InvoiceCustomization.provider_id == provider.id)
            .where(InvoiceCustomization.service_account_id == None)
        ).first()

    total = sum(s.total_amount for s in services)

    page_size = getattr(customization, "page_size", PageSizes.A4)
    
    if isinstance(page_size, PageSizes):
        page_size = page_size.value

    context = {
        "invoice": invoice,
        "invoices_total": total,
        "services": services,
        "provider": provider,
        "custom": customization,
    }
    

    pdf_bytes = render_pdf_from_template(template_name="invoice_template.html", context=context, page_size=page_size)

    return Response(content=pdf_bytes, media_type="application/pdf", headers={
        "Content-Disposition": f"inline; filename=invoice_{invoice_id}.pdf"
    })


