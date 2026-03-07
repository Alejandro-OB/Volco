from app.api.responses import StandardResponse
from fastapi import APIRouter, Depends, status
from app.core.database import SessionDep
from app.api.deps import TokenDep
from app.models import Material, MaterialCreate, MaterialUpdate, Provider
from app.api.routes.login import get_provider_current
from app.services.material import material_service

router = APIRouter(tags=["materials"])


@router.get("/materials/", response_model=StandardResponse[list[Material]])
def get_materials(session: SessionDep, provider: Provider = Depends(get_provider_current)):
    return StandardResponse(data=material_service.get_materials_for_provider(session, provider.id))


@router.post("/materials/", response_model=StandardResponse[Material], status_code=status.HTTP_201_CREATED)
def create_material(data: MaterialCreate, session: SessionDep, provider: Provider = Depends(get_provider_current)):
    return StandardResponse(data=material_service.create_material(session, data, provider.id))


@router.get("/materials/{material_id}/", response_model=StandardResponse[Material])
def get_material(material_id: int, session: SessionDep, provider: Provider = Depends(get_provider_current)):
    return StandardResponse(data=material_service.get_material(session, material_id, provider.id))


@router.patch("/materials/{material_id}/", response_model=StandardResponse[Material], status_code=status.HTTP_201_CREATED)
def update_material(material_id: int, data: MaterialUpdate, session: SessionDep, token: TokenDep, provider: Provider = Depends(get_provider_current)):
    return StandardResponse(data=material_service.update_material(session, material_id, data, provider.id))


@router.delete("/materials/{material_id}/", status_code=status.HTTP_204_NO_CONTENT)
def delete_material(material_id: int, session: SessionDep, token: TokenDep, provider: Provider = Depends(get_provider_current)):
    material_service.delete_material(session, material_id, provider.id)
    return StandardResponse(message="Ok")