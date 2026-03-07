from typing import List
from sqlmodel import Session
from app.repositories.client import client_repository
from app.models.clients import Client
from app.schemas.client import ClientCreate, ClientUpdate
from app.core.exceptions import NotFoundException

class ClientService:
    @staticmethod
    def get_clients_for_provider(session: Session, provider_id: int) -> List[Client]:
        return client_repository.get_by_provider(session, provider_id=provider_id)
        
    @staticmethod
    def create_client(session: Session, data: ClientCreate, provider_id: int) -> Client:
        client_data = data.model_dump()
        client_data["provider_id"] = provider_id
        db_obj = Client(**client_data)
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_client(session: Session, client_id: int, provider_id: int) -> Client:
        client = client_repository.get_by_id_and_provider(session, client_id=client_id, provider_id=provider_id)
        if not client:
            raise NotFoundException(detail="Client not found")
        return client

    @staticmethod
    def update_client(session: Session, client_id: int, data: ClientUpdate, provider_id: int) -> Client:
        client = client_repository.get_by_id_and_provider(session, client_id=client_id, provider_id=provider_id)
        if not client:
            raise NotFoundException(detail="Client not Found")
        
        return client_repository.update(session, db_obj=client, obj_in=data)

    @staticmethod
    def delete_client(session: Session, client_id: int, provider_id: int) -> None:
        client = client_repository.get_by_id_and_provider(session, client_id=client_id, provider_id=provider_id)
        if not client:
            raise NotFoundException(detail="Client not found")
            
        client_repository.remove(session, id=client.id)

client_service = ClientService()
