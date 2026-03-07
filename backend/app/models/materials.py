from typing import TYPE_CHECKING, Optional
from sqlmodel import Field, Relationship
from app.schemas.material import MaterialBase

if TYPE_CHECKING:
    from app.models import Service, Provider

class Material(MaterialBase, table=True):
    __tablename__ = "materials"
    id: int | None = Field(primary_key=True, default=None, index=True)
    services: list["Service"] = Relationship(back_populates="material")
    provider: Optional["Provider"] = Relationship(back_populates="materials")
    provider_id: int | None = Field(foreign_key="providers.id", index=True, default=None)
