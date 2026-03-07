from sqlmodel import Session
from app.repositories.provider import provider_repository
from app.models.providers import Provider
from app.schemas.provider import ProviderCreate, ProviderUpdate
from app.core.exceptions import NotFoundException, BadRequestException, UnauthorizedException
from app.core.security import hash_password, check_password

class ProviderService:
    @staticmethod
    def create_provider(session: Session, data: ProviderCreate) -> Provider:
        provider_data = data.model_dump()
        provider_data["password"] = hash_password(provider_data["password"])
        db_obj = Provider(**provider_data)
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_provider(session: Session, provider_id: int) -> Provider:
        provider = provider_repository.get(session, provider_id)
        if not provider:
            raise NotFoundException(detail="Provider not found")
        return provider

    @staticmethod
    def update_provider(session: Session, provider_id: int, data: ProviderUpdate) -> Provider:
        provider = provider_repository.get(session, provider_id)
        if not provider:
            raise NotFoundException(detail="Provider not found")

        data_dict = data.model_dump(exclude_unset=True)
        old_password = data_dict.get("old_password")
        new_password = data_dict.get("password")

        if new_password:
            if not old_password:
                raise BadRequestException(detail="You must provide the current password to change it.")
            if not check_password(old_password, provider.password):
                raise UnauthorizedException(detail="The current password you entered is incorrect.")
            
            data_dict["password"] = hash_password(new_password)
            data_dict.pop("old_password", None)
        
        data_dict.pop("old_password", None)
        
        return provider_repository.update(session, db_obj=provider, obj_in=data_dict)

provider_service = ProviderService()
