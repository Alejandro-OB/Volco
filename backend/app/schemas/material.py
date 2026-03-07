from sqlmodel import Field, SQLModel

class MaterialBase(SQLModel):
    name: str = Field()
    price: int | None = Field(default=None)

class MaterialCreate(MaterialBase):
    pass

class MaterialUpdate(SQLModel):
    name: str | None = None
    price: int | None = None
