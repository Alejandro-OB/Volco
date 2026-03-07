from app.api.responses import StandardResponse
from fastapi import APIRouter, Depends, Response, status
from app.core.database import SessionDep
from app.api.deps import TokenDep
from app.models import Invoice, InvoiceCreate, Provider
from app.api.routes.login import get_provider_current
from app.services.invoice import invoice_service

router = APIRouter(tags=["invoices"])

@router.get("/invoices/", response_model=StandardResponse[list[Invoice]])
def get_invoices(session: SessionDep, token: TokenDep):
    return StandardResponse(data=invoice_service.get_invoices(session))

@router.post("/invoices/", response_model=StandardResponse[Invoice], status_code=status.HTTP_201_CREATED)
def create_invoice(data: InvoiceCreate, session: SessionDep, token: TokenDep, provider: Provider = Depends(get_provider_current)):
    return StandardResponse(data=invoice_service.create_invoice(session, data, provider.id))

@router.get("/invoices/{invoice_id}", response_model=StandardResponse[Invoice])
def get_invoice(invoice_id: int, session: SessionDep, token: TokenDep):
    return StandardResponse(data=invoice_service.get_invoice(session, invoice_id))

@router.get("/invoices/{invoice_id}/pdf/")
def get_invoice_pdf(invoice_id: int, session: SessionDep, provider: Provider = Depends(get_provider_current)):
    pdf_bytes = invoice_service.generate_pdf(session, invoice_id, provider)
    return Response(content=pdf_bytes, media_type="application/pdf", headers={
        "Content-Disposition": f"inline; filename=invoice_{invoice_id}.pdf"
    })
