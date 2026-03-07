from app.repositories.base import CRUDBase
from app.models.clients import Client
from app.schemas.client import ClientCreate, ClientUpdate
from sqlmodel import Session, select
from typing import Optional, List

class ClientRepository(CRUDBase[Client, ClientCreate, ClientUpdate]):
    def get_by_provider(self, session: Session, *, provider_id: int) -> List[Client]:
        statement = select(Client).where(Client.provider_id == provider_id)
        return session.exec(statement).all()

    def get_by_id_and_provider(self, session: Session, *, client_id: int, provider_id: int) -> Optional[Client]:
        statement = select(Client).where(Client.id == client_id).where(Client.provider_id == provider_id)
        return session.exec(statement).first()

client_repository = ClientRepository(Client)
