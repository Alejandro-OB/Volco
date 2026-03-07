from app.repositories.base import CRUDBase
from app.models.service_accounts import ServiceAccount
from app.models.clients import Client
from app.schemas.service_account import ServiceAccountCreate, ServiceAccountUpdate
from sqlmodel import Session, select
from typing import Optional, List

class ServiceAccountRepository(CRUDBase[ServiceAccount, ServiceAccountCreate, ServiceAccountUpdate]):
    def get_by_provider(self, session: Session, *, provider_id: int) -> List[ServiceAccount]:
        statement = (
            select(ServiceAccount)
            .join(Client, ServiceAccount.client_id == Client.id)
            .where(Client.provider_id == provider_id)
        )
        return session.exec(statement).all()

    def get_by_id_and_provider(self, session: Session, *, service_account_id: int, provider_id: int) -> Optional[ServiceAccount]:
        statement = (
            select(ServiceAccount)
            .join(Client, ServiceAccount.client_id == Client.id)
            .where(ServiceAccount.id == service_account_id)
            .where(Client.provider_id == provider_id)
        )
        return session.exec(statement).first()

    def get_by_client_and_provider(self, session: Session, *, client_id: int, provider_id: int) -> List[ServiceAccount]:
        statement = (
            select(ServiceAccount)
            .join(Client, ServiceAccount.client_id == Client.id)
            .where(ServiceAccount.client_id == client_id)
            .where(Client.provider_id == provider_id)
        )
        return session.exec(statement).all()

service_account_repository = ServiceAccountRepository(ServiceAccount)
