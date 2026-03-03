from datetime import date
from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models import Service, Client, Invoice

class ServiceAccountBase(SQLModel):
    description: str
    start_date: date
    end_date: date


class ServiceAccountCreate(ServiceAccountBase):
    client_id: int 


class ServiceAccount(ServiceAccountBase, table=True):
    __tablename__ = "service_accounts"
    id: int | None = Field(primary_key=True, default=None, index=True)
    client_id: int | None = Field(foreign_key="clients.id", index=True)
    services: list["Service"] = Relationship(back_populates="service_account",cascade_delete=True)
    client: Optional["Client"] = Relationship(back_populates="service_accounts")
    invoice: Optional["Invoice"] = Relationship(back_populates="service_account", cascade_delete=True)


class ServiceAccountUpdate(SQLModel):
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    client_id: int | None = None
    
