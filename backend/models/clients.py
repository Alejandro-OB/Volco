from typing import Optional, TYPE_CHECKING

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from models import Provider, ServiceAccount


class ClientBase(SQLModel):
    name: str = Field(max_length=100)
    phone_number: str | None = Field(max_length=10, default=None) 
    email: EmailStr | None = Field(max_length=100, default=None)
    address: str | None = Field(max_length=100, default=None) 


class Client(ClientBase, table=True):
    __tablename__ = "clients"
    id: int | None = Field(default=None, primary_key=True, index=True)
    service_accounts: list["ServiceAccount"] = Relationship(back_populates="client", cascade_delete=True)
    provider_id: int | None = Field(
        foreign_key="providers.id", default=None, index=True
    )
    provider: Optional["Provider"]= Relationship(back_populates="clients")


class ClientCreate(ClientBase):
    pass


class ClientUpdate(SQLModel):
    name: str | None = None
    phone_number: str | None = None
    email: EmailStr | None = None
    address: str | None = None