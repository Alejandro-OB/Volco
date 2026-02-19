from pydantic import EmailStr
from typing import TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from models import Client, Invoice, InvoiceCustomization, Material
    
class ProviderBase(SQLModel):
    name: str = Field(max_length=100)
    document_number: str = Field(max_length=20)
    email: EmailStr = Field(unique=True, index=True, max_length=100)
    username: str = Field(unique=True, index=True, max_length=100)
    password: str = Field(max_length=255)

class ProviderRead(SQLModel):
    name: str | None = None
    document_number: str | None = None
    email: EmailStr | None = None
    username: str | None = None

class Provider(ProviderBase, table=True):
    __tablename__ = "providers"
    id: int | None = Field(primary_key=True, default=None, index=True)
    clients: list["Client"] = Relationship(back_populates="provider", cascade_delete=True)
    invoices: list["Invoice"] = Relationship(back_populates="provider",cascade_delete=True)
    invoice_customizations: list["InvoiceCustomization"] = Relationship(back_populates="provider", cascade_delete=True)
    materials: list["Material"] = Relationship(back_populates="provider", cascade_delete=True)

class ProviderCreate(ProviderBase):
    pass


class ProviderUpdate(SQLModel):
    name: str | None = None
    document_number: str | None = None
    email: EmailStr | None = None
    username: str | None = None
    password: str | None = None
    old_password: str | None = None
