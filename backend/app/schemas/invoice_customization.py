from sqlmodel import Field, SQLModel
from enum import Enum

class PageSizes(str, Enum):
    A4 = "A4"
    LETTER = "Letter"
    LEGAL = "Legal"

    @property
    def label(self):
        labels = {
            "A4": "A4 (210 × 297 mm)",
            "Letter": "Carta / Letter (216 × 279 mm)",
            "Legal": "Oficio / Legal (216 × 356 mm)",
        }
        return labels[self.value]

class InvoiceCustomizationBase(SQLModel):
    __tablename__ = "invoice_customizations"
    logo_url : str | None = None
    signature_url : str | None = None
    provider_bank: str | None = Field(max_length=50, default=None)
    provider_type_account: str | None = Field(max_length=50, default=None)
    provider_number_account: str | None = Field(max_length=50, default=None)
    service_text: str | None = Field(max_length=100, default=None)
    footer_message: str | None = Field(max_length=100, default=None)
    apply_to_all_accounts: bool  = Field(default=False)
    include_logo: bool = Field(default=True)
    include_signature: bool = Field(default=True)
    include_footer: bool = Field(default=True)
    include_bank_info: bool = Field(default=False)
    page_size: PageSizes = Field(default=PageSizes.A4)
    service_account_id: int | None = Field(default=None, foreign_key="service_accounts.id", index=True)

class InvoiceCustomizationCreate(InvoiceCustomizationBase):
    pass
