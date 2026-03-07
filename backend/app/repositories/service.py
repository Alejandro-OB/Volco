from app.repositories.base import CRUDBase
from app.models.services import Service
from app.models.service_accounts import ServiceAccount
from app.models.clients import Client
from app.schemas.service import ServiceCreate, ServiceUpdate
from sqlmodel import Session, select
from typing import Optional, List

class ServiceRepository(CRUDBase[Service, ServiceCreate, ServiceUpdate]):
    def get_by_provider(self, session: Session, *, provider_id: int) -> List[Service]:
        statement = (
            select(Service)
            .join(ServiceAccount, Service.service_account_id == ServiceAccount.id)
            .join(Client, ServiceAccount.client_id == Client.id)
            .where(Client.provider_id == provider_id)
        )
        return session.exec(statement).all()

    def get_by_id_and_provider(self, session: Session, *, service_id: int, provider_id: int) -> Optional[Service]:
        statement = (
            select(Service)
            .join(ServiceAccount, Service.service_account_id == ServiceAccount.id)
            .join(Client, ServiceAccount.client_id == Client.id)
            .where(Service.id == service_id)
            .where(Client.provider_id == provider_id)
        )
        return session.exec(statement).first()

    def get_by_service_account_and_provider(self, session: Session, *, service_account_id: int, provider_id: int) -> List[Service]:
        statement = (
            select(Service)
            .join(ServiceAccount, Service.service_account_id == ServiceAccount.id)
            .join(Client, ServiceAccount.client_id == Client.id)
            .where(Service.service_account_id == service_account_id)
            .where(Client.provider_id == provider_id)
        )
        return session.exec(statement).all()

service_repository = ServiceRepository(Service)
