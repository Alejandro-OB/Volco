from datetime import date
from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, Relationship
from app.schemas.invoice import InvoiceBase

if TYPE_CHECKING:
    from app.models import Provider, ServiceAccount


class Invoice(InvoiceBase, table=True):
    __tablename__ = "invoices"
    id: int | None = Field(primary_key=True, default=None, index=True)
    invoice_number: str | None = Field(max_length=50, default=None)
    invoice_date: date = Field(default_factory=date.today)
    provider_id: int | None = Field(
        foreign_key="providers.id", default=None, index=True
    )
    provider: Optional["Provider"] = Relationship(back_populates="invoices")
    service_account: Optional["ServiceAccount"] = Relationship(back_populates="invoice")
