from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import ValidationError
from sqlmodel import select

from app.db import SessionDep
from app.dependencies import TokenDep
from app.utils.supabase_upload import upload_to_supabase
from models import InvoiceCustomization, Provider
from models.invoice_customization import PageSizes
from routers.login import get_provider_current

router = APIRouter(tags=["invoice-customizations"])

@router.post("/invoice-customizations/", response_model=InvoiceCustomization, status_code=status.HTTP_201_CREATED)
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
    logo: UploadFile = File(None),
    signature: UploadFile = File(None),
    provider: Provider = Depends(get_provider_current)
):
    # Subir archivos a Supabase y obtener URLs si se proporcionan
    logo_url = None
    signature_url = None

    if logo is not None:
        logo_url = await upload_to_supabase(logo, folder="logos")
    if signature is not None:
        signature_url = await upload_to_supabase(signature, folder="signatures")

    # Construir los datos de personalización
    data_dict = {
        "provider_bank": provider_bank,
        "provider_type_account": provider_type_account,
        "provider_number_account": provider_number_account,
        "service_text": service_text,
        "footer_message": footer_message,
        "apply_to_all_accounts": apply_to_all_accounts,
        "include_logo": include_logo,
        "include_signature": include_signature,
        "include_footer": include_footer,
        "include_bank_info": include_bank_info,
        "page_size": page_size,
        "logo_url": logo_url,
        "signature_url": signature_url,
    }

    try:
        # Validar datos con el modelo
        invoice_customization = InvoiceCustomization.model_validate(data_dict)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))

    invoice_customization.provider_id = provider.id
    session.add(invoice_customization)
    session.commit()
    session.refresh(invoice_customization)
    return invoice_customization

@router.patch("/invoice-customizations/{customization_id}/", response_model=InvoiceCustomization)
async def update_invoice_customization(
    customization_id: int,
    session: SessionDep,
    provider_bank: str = Form(None),
    provider_type_account: str = Form(None),
    provider_number_account: str = Form(None),
    service_text: str = Form(None),
    footer_message: str = Form(None),
    apply_to_all_accounts: bool = Form(None),
    include_logo: bool = Form(None),
    include_signature: bool = Form(None),
    include_footer: bool = Form(None),
    include_bank_info: bool = Form(None),
    page_size: PageSizes = Form(None),
    logo: UploadFile = File(None),
    signature: UploadFile = File(None),
    
    provider: Provider = Depends(get_provider_current),
):
    # Obtiene la personalización actual
    customization = session.get(InvoiceCustomization, customization_id)
    if customization is None or customization.provider_id != provider.id:
        raise HTTPException(status_code=404, detail="Personalización no encontrada.")

    # Sube archivos nuevos si se proporcionan y actualiza las URL
    if logo is not None:
        logo_url = await upload_to_supabase(logo, folder="logos")
        customization.logo_url = logo_url
    if signature is not None:
        signature_url = await upload_to_supabase(signature, folder="signatures")
        customization.signature_url = signature_url

    # Actualiza solo los campos enviados (no None)
    fields = [
        "provider_bank", "provider_type_account", "provider_number_account",
        "service_text", "footer_message", "apply_to_all_accounts",
        "include_logo", "include_signature", "include_footer",
        "include_bank_info", "page_size"
    ]
    for field in fields:
        value = locals()[field]
        if value is not None:
            setattr(customization, field, value)
    
    session.add(customization)  
    session.commit()
    session.refresh(customization)
    return customization

@router.get("/invoice-customizations/", response_model=list[InvoiceCustomization])
def get_invoice_customizations(session: SessionDep, token: TokenDep):
    return session.exec(select(InvoiceCustomization)).all()

@router.get("/invoice-customizations/{invoice_customization_id}", response_model=InvoiceCustomization)
def get_invoice_customization(invoice_customization_id: int, session: SessionDep, token: TokenDep):
    custom = session.get(InvoiceCustomization, invoice_customization_id)
    if not custom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customization not found")
    return custom

@router.get("/invoice-customizations/my/", response_model=InvoiceCustomization)
def get_invoice_customization_by_provider(session: SessionDep, provider: Provider = Depends(get_provider_current)):
    provider_id = provider.id
    custom = session.exec(select(InvoiceCustomization).where(InvoiceCustomization.provider_id==provider_id)).first()
    if not custom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customization not found")
    return custom

@router.delete("/invoice-customizations/{invoice_customization_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice_customization(invoice_customization_id: int, session: SessionDep, token: TokenDep):
    custom = session.get(InvoiceCustomization, invoice_customization_id)
    if not custom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customization not found")
    session.delete(custom)
    session.commit()
    return {"detail": "ok"}