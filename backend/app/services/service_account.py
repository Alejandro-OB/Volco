from typing import List
from sqlmodel import Session
from app.repositories.service_account import service_account_repository
from app.repositories.client import client_repository
from app.models.service_accounts import ServiceAccount
from app.schemas.service_account import ServiceAccountCreate, ServiceAccountUpdate
from app.core.exceptions import NotFoundException

class ServiceAccountService:
    @staticmethod
    def get_accounts_for_provider(session: Session, provider_id: int) -> List[ServiceAccount]:
        return service_account_repository.get_by_provider(session, provider_id=provider_id)
        
    @staticmethod
    def create_account(session: Session, data: ServiceAccountCreate, provider_id: int) -> ServiceAccount:
        # Validate that client belongs to provider
        client = client_repository.get_by_id_and_provider(session, client_id=data.client_id, provider_id=provider_id)
        if not client:
            raise NotFoundException(detail="Client not found or unauthorized")
        
        return service_account_repository.create(session, obj_in=data)

    @staticmethod
    def get_account(session: Session, service_account_id: int, provider_id: int) -> ServiceAccount:
        account = service_account_repository.get_by_id_and_provider(session, service_account_id=service_account_id, provider_id=provider_id)
        if not account:
            raise NotFoundException(detail="Account not found or unauthorized")
        return account

    @staticmethod
    def update_account(session: Session, service_account_id: int, data: ServiceAccountUpdate, provider_id: int) -> ServiceAccount:
        account = service_account_repository.get_by_id_and_provider(session, service_account_id=service_account_id, provider_id=provider_id)
        if not account:
            raise NotFoundException(detail="Account not found or unauthorized")
        
        if data.client_id:
            client = client_repository.get_by_id_and_provider(session, client_id=data.client_id, provider_id=provider_id)
            if not client:
                raise NotFoundException(detail="Client not found or unauthorized")
                
        return service_account_repository.update(session, db_obj=account, obj_in=data)

    @staticmethod
    def delete_account(session: Session, service_account_id: int, provider_id: int) -> None:
        account = service_account_repository.get_by_id_and_provider(session, service_account_id=service_account_id, provider_id=provider_id)
        if not account:
            raise NotFoundException(detail="Account not found or unauthorized")
            
        service_account_repository.remove(session, id=account.id)

    @staticmethod
    def get_accounts_by_client(session: Session, client_id: int, provider_id: int) -> List[ServiceAccount]:
        accounts = service_account_repository.get_by_client_and_provider(
            session, client_id=client_id, provider_id=provider_id
        )
        if not accounts:
            raise NotFoundException(detail="Accounts not found")
        return accounts

service_account_service = ServiceAccountService()
