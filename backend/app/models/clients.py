from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, Relationship
from app.schemas.client import ClientBase

if TYPE_CHECKING:
    from app.models import Provider, ServiceAccount

class Client(ClientBase, table=True):
    __tablename__ = "clients"
    id: int | None = Field(default=None, primary_key=True, index=True)
    service_accounts: list["ServiceAccount"] = Relationship(back_populates="client", cascade_delete=True)
    provider_id: int | None = Field(
        foreign_key="providers.id", default=None, index=True
    )
    provider: Optional["Provider"]= Relationship(back_populates="clients")