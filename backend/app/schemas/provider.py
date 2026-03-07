from pydantic import EmailStr
from sqlmodel import Field, SQLModel

class ProviderBase(SQLModel):
    name: str = Field(max_length=100)
    document_number: str = Field(max_length=20)
    email: EmailStr = Field(unique=True, index=True, max_length=100)
    username: str = Field(unique=True, index=True, max_length=100)
    password: str = Field(max_length=255)

class ProviderRead(SQLModel):
    name: str | None = None
    document_number: str | None = None
    email: EmailStr | None = None
    username: str | None = None

class ProviderCreate(ProviderBase):
    pass

class ProviderUpdate(SQLModel):
    name: str | None = None
    document_number: str | None = None
    email: EmailStr | None = None
    username: str | None = None
    password: str | None = None
    old_password: str | None = None
