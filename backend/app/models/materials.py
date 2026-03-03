from typing import TYPE_CHECKING, Optional
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models import Service, Provider

class MaterialBase(SQLModel):
    name: str = Field()
    price: int | None = Field(default=None)


class Material(MaterialBase, table=True):
    __tablename__ = "materials"
    id: int | None = Field(primary_key=True, default=None, index=True)
    services: list["Service"] = Relationship(back_populates="material")
    provider: Optional["Provider"] = Relationship(back_populates="materials")
    provider_id: int | None = Field(foreign_key="providers.id", index=True, default=None)


class MaterialCreate(MaterialBase):
    pass


class MaterialUpdate(SQLModel):
    name: str | None = None
    price: int | None = None
