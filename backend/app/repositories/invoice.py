from app.repositories.base import CRUDBase
from app.models.invoices import Invoice
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate
from sqlmodel import Session, select, desc
from typing import Optional, List

class InvoiceRepository(CRUDBase[Invoice, InvoiceCreate, InvoiceUpdate]):
    def get_by_provider(self, session: Session, *, provider_id: int) -> List[Invoice]:
        statement = select(Invoice).where(Invoice.provider_id == provider_id)
        return session.exec(statement).all()

    def get_by_id_and_provider(self, session: Session, *, invoice_id: int, provider_id: int) -> Optional[Invoice]:
        statement = select(Invoice).where(Invoice.id == invoice_id).where(Invoice.provider_id == provider_id)
        return session.exec(statement).first()

    def get_last_invoice_by_provider(self, session: Session, *, provider_id: int) -> Optional[Invoice]:
        return session.exec(
            select(Invoice)
            .where(Invoice.provider_id == provider_id)
            .order_by(desc(Invoice.id))
        ).first()

invoice_repository = InvoiceRepository(Invoice)
