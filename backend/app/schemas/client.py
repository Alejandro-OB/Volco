from pydantic import EmailStr
from sqlmodel import Field, SQLModel

class ClientBase(SQLModel):
    name: str = Field(max_length=100)
    phone_number: str | None = Field(max_length=10, default=None) 
    email: EmailStr | None = Field(max_length=100, default=None)
    address: str | None = Field(max_length=100, default=None) 

class ClientCreate(ClientBase):
    pass

class ClientUpdate(SQLModel):
    name: str | None = None
    phone_number: str | None = None
    email: EmailStr | None = None
    address: str | None = None
