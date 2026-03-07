from app.api.responses import StandardResponse
from fastapi import APIRouter, Depends, status
from app.api.deps import TokenDep
from app.core.database import SessionDep
from app.api.routes.login import get_provider_current
from app.models import Client, ClientCreate, ClientUpdate, Provider
from app.services.client import client_service

router = APIRouter(tags=["clients"])

@router.get("/clients/", response_model=StandardResponse[list[Client]])
def get_clients(
    session: SessionDep,
    token: TokenDep,
    provider: Provider = Depends(get_provider_current),
):
    return StandardResponse(data=client_service.get_clients_for_provider(session, provider.id))


@router.post("/clients/", response_model=StandardResponse[Client], status_code=status.HTTP_201_CREATED)
def create_client(
    session: SessionDep,
    data: ClientCreate,
    provider: Provider = Depends(get_provider_current),
):
    return StandardResponse(data=client_service.create_client(session, data, provider.id))


@router.get("/clients/{client_id}/", response_model=StandardResponse[Client])
def get_client(
    client_id: int,
    token: TokenDep,
    session: SessionDep,
    provider: Provider = Depends(get_provider_current),
):
    return StandardResponse(data=client_service.get_client(session, client_id, provider.id))


@router.patch("/clients/{client_id}/", response_model=StandardResponse[Client], status_code=status.HTTP_201_CREATED)
def update_client(
    client_id: int,
    data: ClientUpdate,
    session: SessionDep,
    token: TokenDep,
    provider: Provider = Depends(get_provider_current),
):
    return StandardResponse(data=client_service.update_client(session, client_id, data, provider.id))


@router.delete("/clients/{client_id}/", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(
    client_id: int,
    session: SessionDep,
    token: TokenDep,
    provider: Provider = Depends(get_provider_current),
):
    client_service.delete_client(session, client_id, provider.id)
    return StandardResponse(message="Ok")
