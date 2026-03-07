from datetime import date
from sqlmodel import SQLModel

class ServiceAccountBase(SQLModel):
    description: str
    start_date: date
    end_date: date

class ServiceAccountCreate(ServiceAccountBase):
    client_id: int 

class ServiceAccountUpdate(SQLModel):
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    client_id: int | None = None
