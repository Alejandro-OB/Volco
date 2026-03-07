from app.repositories.base import CRUDBase
from app.models.materials import Material
from app.schemas.material import MaterialCreate, MaterialUpdate
from sqlmodel import Session, select
from typing import Optional, List

class MaterialRepository(CRUDBase[Material, MaterialCreate, MaterialUpdate]):
    def get_by_provider(self, session: Session, *, provider_id: int) -> List[Material]:
        statement = select(Material).where(Material.provider_id == provider_id)
        return session.exec(statement).all()

    def get_by_id_and_provider(self, session: Session, *, material_id: int, provider_id: int) -> Optional[Material]:
        statement = select(Material).where(Material.id == material_id).where(Material.provider_id == provider_id)
        return session.exec(statement).first()

material_repository = MaterialRepository(Material)
