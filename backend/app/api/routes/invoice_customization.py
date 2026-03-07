from app.api.responses import StandardResponse
from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from app.core.database import SessionDep
from app.api.deps import TokenDep
from app.models import InvoiceCustomization, Provider
from app.models.invoice_customization import PageSizes
from app.api.routes.login import get_provider_current
from app.services.invoice_customization import invoice_customization_service

router = APIRouter(tags=["invoice-customizations"])

@router.post("/invoice-customizations/", response_model=StandardResponse[InvoiceCustomization], status_code=status.HTTP_201_CREATED)
async def create_invoice_customization(
    session: SessionDep,
    token: TokenDep,
    provider_bank: str = Form(None),
    provider_type_account: str = Form(None),
    provider_number_account: str = Form(None),
    service_text: str = Form(None),
    footer_message: str = Form(None),
    apply_to_all_accounts: bool = Form(False),
    include_logo: bool = Form(True),
    include_signature: bool = Form(True),
    include_footer: bool = Form(True),
    include_bank_info: bool = Form(False),
    page_size: PageSizes = Form(PageSizes.A4),
    service_account_id: int | None = Form(None),
    logo: UploadFile = File(None),
    signature: UploadFile = File(None),
    fallback_logo_url: str | None = Form(None),
    fallback_signature_url: str | None = Form(None),
    provider: Provider = Depends(get_provider_current)
):
    data_dict = {
        "provider_bank": provider_bank, "provider_type_account": provider_type_account,
        "provider_number_account": provider_number_account, "service_text": service_text,
        "footer_message": footer_message, "apply_to_all_accounts": apply_to_all_accounts,
        "include_logo": include_logo, "include_signature": include_signature,
        "include_footer": include_footer, "include_bank_info": include_bank_info,
        "page_size": page_size, "service_account_id": None if apply_to_all_accounts else service_account_id,
        "logo_url": fallback_logo_url, "signature_url": fallback_signature_url,
    }

    customization = await invoice_customization_service.create_customization(
        session, data_dict, provider.id, logo, signature
    )
    return StandardResponse(data=customization)

@router.patch("/invoice-customizations/{customization_id}/", response_model=StandardResponse[InvoiceCustomization])
async def update_invoice_customization(
    customization_id: int,
    session: SessionDep,
    provider_bank: str | None = Form(None), provider_type_account: str | None = Form(None),
    provider_number_account: str | None = Form(None), service_text: str | None = Form(None),
    footer_message: str | None = Form(None), apply_to_all_accounts: bool | None = Form(None),
    include_logo: bool | None = Form(None), include_signature: bool | None = Form(None),
    include_footer: bool | None = Form(None), include_bank_info: bool | None = Form(None),
    page_size: PageSizes | None = Form(None), service_account_id: int | None = Form(None),
    logo: UploadFile | None = File(None), signature: UploadFile | None = File(None),
    provider: Provider = Depends(get_provider_current),
):
    data_dict = {
        "provider_bank": provider_bank, "provider_type_account": provider_type_account,
        "provider_number_account": provider_number_account, "service_text": service_text,
        "footer_message": footer_message, "apply_to_all_accounts": apply_to_all_accounts,
        "include_logo": include_logo, "include_signature": include_signature,
        "include_footer": include_footer, "include_bank_info": include_bank_info,
        "page_size": page_size, "service_account_id": None if apply_to_all_accounts else service_account_id,
    }
    data_dict = {k: v for k, v in data_dict.items() if v is not None}

    customization = await invoice_customization_service.update_customization(
        session, customization_id, data_dict, provider.id, logo, signature
    )
    return StandardResponse(data=customization)

@router.get("/invoice-customizations/", response_model=StandardResponse[list[InvoiceCustomization]])
def get_invoice_customizations(session: SessionDep, token: TokenDep):
    return StandardResponse(data=invoice_customization_service.get_customizations(session))


@router.get("/invoice-customizations/{invoice_customization_id}", response_model=StandardResponse[InvoiceCustomization])
def get_invoice_customization(invoice_customization_id: int, session: SessionDep, token: TokenDep):
    return StandardResponse(data=invoice_customization_service.get_customization(session, invoice_customization_id))


@router.get("/invoice-customizations/my/", response_model=StandardResponse[InvoiceCustomization])
def get_invoice_customization_by_provider(
    session: SessionDep, 
    account_id: int | None = None,
    provider: Provider = Depends(get_provider_current)
):
    return StandardResponse(data=invoice_customization_service.get_customization_for_provider_account(session, provider.id, account_id))


@router.delete("/invoice-customizations/{invoice_customization_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice_customization(invoice_customization_id: int, session: SessionDep, token: TokenDep):
    invoice_customization_service.delete_customization(session, invoice_customization_id)
    return StandardResponse(message="Ok")