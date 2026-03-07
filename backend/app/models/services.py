from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, Relationship
from app.schemas.service import ServiceBase

if TYPE_CHECKING:
    from app.models import Material, ServiceAccount


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
