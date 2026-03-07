from datetime import date
from sqlmodel import Field, SQLModel

class ServiceBase(SQLModel):
    service_date: date | None = None
    quantity: int
    price: int
    custom_material: str | None = Field(max_length=50, default=None)

class ServiceCreate(ServiceBase):
    material_id: int | None = None
    service_account_id: int

class ServiceUpdate(SQLModel):
    service_date: date | None = None
    quantity: int | None = None
    price: int | None = None
    material_id: int | None = None
    custom_material: str | None = None
