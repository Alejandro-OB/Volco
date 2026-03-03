from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select

from app.db import SessionDep
from app.dependencies import TokenDep
from app.models import Material, MaterialCreate, Provider
from app.routers.login import get_provider_current

router = APIRouter(tags=["materials"])

@router.get("/materials/", response_model=list[Material])
def get_materials( session: SessionDep, provider: Provider = Depends(get_provider_current)):
    return session.exec(select(Material).where(Material.provider_id==provider.id)).all()

@router.post("/materials/", response_model=Material, status_code=status.HTTP_201_CREATED)
def create_material(data: MaterialCreate, session: SessionDep, provider: Provider = Depends(get_provider_current)):
    material = Material.model_validate(data.model_dump())
    material.provider_id = provider.id
    session.add(material)
    session.commit()
    session.refresh(material)
    return material

@router.get("/materials/{material_id}/", response_model=Material)
def get_material(material_id: int, session: SessionDep, provider: Provider = Depends(get_provider_current)):
    material = session.exec(select(Material).where(Material.id==material_id).where(Material.provider_id==provider.id)).first()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    return material

@router.patch("/materials/{material_id}/", response_model=Material, status_code=status.HTTP_201_CREATED)
def update_material(material_id: int, data: Material, session: SessionDep, token: TokenDep):
    material = session.get(Material, material_id)
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    data_dict = data.model_dump(exclude_unset=True)
    material.sqlmodel_update(data_dict)
    session.add(material)
    session.commit()
    session.refresh(material)
    return material

@router.delete("/materials/{material_id}/", status_code=status.HTTP_204_NO_CONTENT)
def delete_material(material_id: int, session: SessionDep, token: TokenDep):
    material = session.get(Material, material_id)
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    session.delete(material)
    session.commit()
    return {"detail": "Ok"}