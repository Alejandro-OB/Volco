from sqlmodel import Field, SQLModel

class InvoiceBase(SQLModel):
    service_account_id: int | None = Field(
        foreign_key="service_accounts.id", default=None, index=True, unique=True
    )

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceUpdate(SQLModel):
    service_account_id: int | None = None
