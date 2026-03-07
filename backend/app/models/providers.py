from typing import TYPE_CHECKING
from sqlmodel import Field, Relationship
from app.schemas.provider import ProviderBase

if TYPE_CHECKING:
    from app.models import Client, Invoice, InvoiceCustomization, Material
    
class Provider(ProviderBase, table=True):
    __tablename__ = "providers"
    id: int | None = Field(primary_key=True, default=None, index=True)
    clients: list["Client"] = Relationship(back_populates="provider", cascade_delete=True)
    invoices: list["Invoice"] = Relationship(back_populates="provider",cascade_delete=True)
    invoice_customizations: list["InvoiceCustomization"] = Relationship(back_populates="provider", cascade_delete=True)
    materials: list["Material"] = Relationship(back_populates="provider", cascade_delete=True)
