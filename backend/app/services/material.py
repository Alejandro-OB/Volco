from typing import List
from sqlmodel import Session
from app.repositories.material import material_repository
from app.models.materials import Material
from app.schemas.material import MaterialCreate, MaterialUpdate
from app.core.exceptions import NotFoundException

class MaterialService:
    @staticmethod
    def get_materials_for_provider(session: Session, provider_id: int) -> List[Material]:
        return material_repository.get_by_provider(session, provider_id=provider_id)
        
    @staticmethod
    def create_material(session: Session, data: MaterialCreate, provider_id: int) -> Material:
        material_data = data.model_dump()
        material_data["provider_id"] = provider_id
        db_obj = Material(**material_data)
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_material(session: Session, material_id: int, provider_id: int) -> Material:
        material = material_repository.get_by_id_and_provider(session, material_id=material_id, provider_id=provider_id)
        if not material:
            raise NotFoundException(detail="Material not found")
        return material

    @staticmethod
    def update_material(session: Session, material_id: int, data: MaterialUpdate, provider_id: int) -> Material:
        material = material_repository.get_by_id_and_provider(session, material_id=material_id, provider_id=provider_id)
        if not material:
            raise NotFoundException(detail="Material not found")
        
        return material_repository.update(session, db_obj=material, obj_in=data)

    @staticmethod
    def delete_material(session: Session, material_id: int, provider_id: int) -> None:
        material = material_repository.get_by_id_and_provider(session, material_id=material_id, provider_id=provider_id)
        if not material:
            raise NotFoundException(detail="Material not found")
            
        material_repository.remove(session, id=material.id)

material_service = MaterialService()
