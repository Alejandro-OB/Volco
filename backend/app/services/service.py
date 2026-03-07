from typing import List
from sqlmodel import Session
from app.repositories.service import service_repository
from app.models.services import Service
from app.schemas.service import ServiceCreate, ServiceUpdate
from app.core.exceptions import NotFoundException

class ServiceService:
    @staticmethod
    def get_services_for_provider(session: Session, provider_id: int) -> List[Service]:
        return service_repository.get_by_provider(session, provider_id=provider_id)
        
    @staticmethod
    def create_service(session: Session, data: ServiceCreate, provider_id: int) -> Service:
        service_data = data.model_dump()
        service_data["total_amount"] = service_data.get("quantity", 0) * service_data.get("price", 0)
        db_obj = Service(**service_data)
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_service(session: Session, service_id: int, provider_id: int) -> Service:
        service = service_repository.get_by_id_and_provider(session, service_id=service_id, provider_id=provider_id)
        if not service:
            raise NotFoundException(detail="Service not found or unauthorized")
        return service

    @staticmethod
    def update_service(session: Session, service_id: int, data: ServiceUpdate, provider_id: int) -> Service:
        service = service_repository.get_by_id_and_provider(session, service_id=service_id, provider_id=provider_id)
        if not service:
            raise NotFoundException(detail="Service not found or unauthorized")
        
        data_dict = data.model_dump(exclude_unset=True)
        price = data_dict.get("price", service.price)
        quantity = data_dict.get("quantity", service.quantity)
        
        if price is not None and quantity is not None:
            data_dict["total_amount"] = price * quantity

        return service_repository.update(session, db_obj=service, obj_in=data_dict)

    @staticmethod
    def delete_service(session: Session, service_id: int, provider_id: int) -> None:
        service = service_repository.get_by_id_and_provider(session, service_id=service_id, provider_id=provider_id)
        if not service:
            raise NotFoundException(detail="Service not found or unauthorized")
            
        service_repository.remove(session, id=service.id)

    @staticmethod
    def get_services_by_service_account(session: Session, service_account_id: int, provider_id: int) -> List[Service]:
        return service_repository.get_by_service_account_and_provider(
            session, service_account_id=service_account_id, provider_id=provider_id
        )

service_service = ServiceService()
