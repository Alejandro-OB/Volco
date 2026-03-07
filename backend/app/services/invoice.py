from typing import List
from sqlmodel import Session
from app.repositories.invoice import invoice_repository
from app.models.invoices import Invoice
from app.schemas.invoice import InvoiceCreate
from app.core.exceptions import NotFoundException
from app.models.providers import Provider
from app.services.invoice_customization import invoice_customization_service
from app.utils.pdf_generator import render_pdf_from_template

class InvoiceService:
    @staticmethod
    def get_invoices(session: Session) -> List[Invoice]:
        return invoice_repository.get_multi(session)

    @staticmethod
    def create_invoice(session: Session, data: InvoiceCreate, provider_id: int) -> Invoice:
        invoice = Invoice.model_validate(data.model_dump())
        invoice.provider_id = provider_id

        if not invoice.invoice_number:
            last_invoice = invoice_repository.get_last_invoice_by_provider(session, provider_id=provider_id)
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

    @staticmethod
    def get_invoice(session: Session, invoice_id: int) -> Invoice:
        invoice = invoice_repository.get(session, invoice_id)
        if not invoice:
            raise NotFoundException(detail="Invoice not found")
        return invoice

    @staticmethod
    def generate_pdf(session: Session, invoice_id: int, provider: Provider) -> bytes:
        invoice = invoice_repository.get(session, invoice_id)
        if not invoice:
            raise NotFoundException(detail="Invoice not found")
            
        services = invoice.service_account.services
        services = sorted(services, key=lambda s: s.service_date)
        
        try:
            customization = invoice_customization_service.get_customization_for_provider_account(
                session, provider_id=provider.id, account_id=invoice.service_account_id
            )
        except NotFoundException:
            customization = None

        total = sum((s.total_amount for s in services if s.total_amount is not None), 0)

        from app.models.invoice_customization import PageSizes
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
        return pdf_bytes

invoice_service = InvoiceService()
