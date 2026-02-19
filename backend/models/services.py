from datetime import date
from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from models import Material, ServiceAccount


class ServiceBase(SQLModel):
    service_date: date | None = None
    quantity: int
    price: int
    custom_material: str | None = Field(max_length=50, default=None)


class Service(ServiceBase, table=True):
    __tablename__ = "services"
    id: int | None = Field(primary_key=True, default=None, index=True)
    material_id: int | None = Field(foreign_key="materials.id", index=True, default=None)
    material: Optional["Material"] = Relationship(back_populates="services")
    service_account_id: int | None = Field(
        foreign_key="service_accounts.id", default=None
    )
    service_account: Optional["ServiceAccount"] = Relationship(
        back_populates="services"
    )
    total_amount: int | None = Field(default=None)


class ServiceCreate(ServiceBase):
    material_id: int | None = None
    service_account_id: int

class ServiceUpdate(SQLModel):
    service_date: date | None = None
    quantity: int | None = None
    price: int | None = None
    material_id: int | None = None
    custom_material: str | None = None
