from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, Relationship
from app.schemas.invoice_customization import InvoiceCustomizationBase, PageSizes

if TYPE_CHECKING:
    from app.models import Provider, ServiceAccount

class InvoiceCustomization(InvoiceCustomizationBase, table=True):
    id: int | None = Field(primary_key=True, default=None, index=True)
    provider: Optional["Provider"] = Relationship(back_populates="invoice_customizations")
    provider_id: int | None = Field(foreign_key="providers.id", index=True, default=None)
    
    service_account: Optional["ServiceAccount"] = Relationship()
