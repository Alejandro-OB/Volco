from app.repositories.base import CRUDBase
from app.models.providers import Provider
from app.schemas.provider import ProviderCreate, ProviderUpdate
from sqlmodel import Session, select
from typing import Optional

class ProviderRepository(CRUDBase[Provider, ProviderCreate, ProviderUpdate]):
    def get_by_username(self, session: Session, *, username: str) -> Optional[Provider]:
        statement = select(Provider).where(Provider.username == username)
        return session.exec(statement).first()
        
    def get_by_email(self, session: Session, *, email: str) -> Optional[Provider]:
        statement = select(Provider).where(Provider.email == email)
        return session.exec(statement).first()

provider_repository = ProviderRepository(Provider)
