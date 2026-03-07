from app.api.responses import StandardResponse
from fastapi import APIRouter, status, Depends
from app.core.database import SessionDep
from app.api.deps import TokenDep
from app.models import ProviderRead
from app.schemas.provider import ProviderCreate, ProviderUpdate
from app.services.provider import provider_service

router = APIRouter(tags=["providers"])

@router.post("/providers/", response_model=StandardResponse[ProviderRead], status_code=status.HTTP_201_CREATED)
def create_provider(session: SessionDep, data: ProviderCreate):
    return StandardResponse(data=provider_service.create_provider(session, data))

@router.patch("/providers/{provider_id}/", response_model=StandardResponse[ProviderRead])
def update_provider(provider_id: int, data: ProviderUpdate, session: SessionDep, token: TokenDep):
    return StandardResponse(data=provider_service.update_provider(session, provider_id, data))

@router.get("/providers/{provider_id}/", response_model=StandardResponse[ProviderRead])
def get_provider(provider_id: int, session: SessionDep, token: TokenDep):
    return StandardResponse(data=provider_service.get_provider(session, provider_id))