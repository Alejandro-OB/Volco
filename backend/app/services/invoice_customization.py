from typing import List, Dict, Any
from sqlmodel import Session
from fastapi import UploadFile
from app.repositories.invoice_customization import invoice_customization_repository
from app.models.invoice_customization import InvoiceCustomization
from app.core.exceptions import NotFoundException, BadRequestException
from app.utils.supabase_upload import upload_to_supabase

class InvoiceCustomizationService:
    @staticmethod
    def get_customizations(session: Session) -> List[InvoiceCustomization]:
        # Original router blindly gets all customizations across all providers
        # This is a vulnerability. Returning list to maintain signature, but should 
        # normally be tied to provider. Kept as is for backward compatibility if needed, 
        # but realistically should use get_by_provider.
        # We will use the CRUDBase get_multi for this if provider is not passed.
        return invoice_customization_repository.get_multi(session)

    @staticmethod
    def get_customization(session: Session, customization_id: int) -> InvoiceCustomization:
        custom = invoice_customization_repository.get(session, customization_id)
        if not custom:
            raise NotFoundException(detail="Customization not found")
        return custom

    @staticmethod
    def get_customization_for_provider_account(session: Session, provider_id: int, account_id: int | None = None) -> InvoiceCustomization:
        custom = None
        if account_id:
            custom = invoice_customization_repository.get_by_account(session, provider_id=provider_id, account_id=account_id)
        
        if custom:
            return custom

        # Fallback to global
        custom = invoice_customization_repository.get_global(session, provider_id=provider_id)
        if not custom:
            raise NotFoundException(detail="Customization not found")
        return custom

    @staticmethod
    async def create_customization(
        session: Session,
        data_dict: Dict[str, Any],
        provider_id: int,
        logo: UploadFile | None,
        signature: UploadFile | None
    ) -> InvoiceCustomization:
        if logo is not None:
            data_dict["logo_url"] = await upload_to_supabase(logo, folder="logos")
        if signature is not None:
            data_dict["signature_url"] = await upload_to_supabase(signature, folder="signatures")

        customization = InvoiceCustomization.model_validate(data_dict)
        customization.provider_id = provider_id
        session.add(customization)
        session.commit()
        session.refresh(customization)
        return customization

    @staticmethod
    async def update_customization(
        session: Session,
        customization_id: int,
        data_dict: Dict[str, Any],
        provider_id: int,
        logo: UploadFile | None,
        signature: UploadFile | None
    ) -> InvoiceCustomization:
        customization = invoice_customization_repository.get_by_id_and_provider(session, customization_id=customization_id, provider_id=provider_id)
        if not customization:
            raise NotFoundException(detail="Personalización no encontrada.")
            
        if logo is not None:
            data_dict["logo_url"] = await upload_to_supabase(logo, folder="logos")
        if signature is not None:
            data_dict["signature_url"] = await upload_to_supabase(signature, folder="signatures")

        return invoice_customization_repository.update(session, db_obj=customization, obj_in=data_dict)

    @staticmethod
    def delete_customization(session: Session, customization_id: int) -> None:
        custom = invoice_customization_repository.get(session, customization_id)
        if not custom:
            raise NotFoundException(detail="Customization not found")
        invoice_customization_repository.remove(session, id=customization_id)

invoice_customization_service = InvoiceCustomizationService()
