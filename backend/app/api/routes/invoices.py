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

@router.get("/invoices/{invoice_id}/excel/")
def get_invoice_excel(invoice_id: int, session: SessionDep, provider: Provider = Depends(get_provider_current)):
    excel_bytes = invoice_service.generate_excel(session, invoice_id, provider)
    return Response(content=excel_bytes, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={
        "Content-Disposition": f"attachment; filename=invoice_{invoice_id}.xlsx"
    })

@router.get("/invoices/{invoice_id}/word/")
def get_invoice_word(invoice_id: int, session: SessionDep, provider: Provider = Depends(get_provider_current)):
    word_bytes = invoice_service.generate_word(session, invoice_id, provider)
    return Response(content=word_bytes, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", headers={
        "Content-Disposition": f"attachment; filename=invoice_{invoice_id}.docx"
    })
