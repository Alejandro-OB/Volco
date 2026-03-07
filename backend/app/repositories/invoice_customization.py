from app.repositories.base import CRUDBase
from app.models.invoice_customization import InvoiceCustomization
from app.schemas.invoice_customization import InvoiceCustomizationCreate
from sqlmodel import Session, select
from typing import Optional, List, Dict, Any

class InvoiceCustomizationRepository(CRUDBase[InvoiceCustomization, InvoiceCustomizationCreate, Dict[str, Any]]):
    def get_by_provider(self, session: Session, *, provider_id: int) -> List[InvoiceCustomization]:
        statement = select(InvoiceCustomization).where(InvoiceCustomization.provider_id == provider_id)
        return session.exec(statement).all()

    def get_by_id_and_provider(self, session: Session, *, customization_id: int, provider_id: int) -> Optional[InvoiceCustomization]:
        statement = select(InvoiceCustomization).where(InvoiceCustomization.id == customization_id).where(InvoiceCustomization.provider_id == provider_id)
        return session.exec(statement).first()

    def get_by_account(self, session: Session, *, provider_id: int, account_id: int) -> Optional[InvoiceCustomization]:
        statement = (
            select(InvoiceCustomization)
            .where(InvoiceCustomization.provider_id == provider_id)
            .where(InvoiceCustomization.service_account_id == account_id)
            .where(InvoiceCustomization.apply_to_all_accounts == False)
        )
        return session.exec(statement).first()

    def get_global(self, session: Session, *, provider_id: int) -> Optional[InvoiceCustomization]:
        statement = (
            select(InvoiceCustomization)
            .where(InvoiceCustomization.provider_id == provider_id)
            .where(InvoiceCustomization.service_account_id == None)
        )
        return session.exec(statement).first()

invoice_customization_repository = InvoiceCustomizationRepository(InvoiceCustomization)
