from app.api.responses import StandardResponse
from fastapi import APIRouter, Depends, status
from app.core.database import SessionDep
from app.api.deps import TokenDep
from app.models import ServiceAccountUpdate, ServiceAccount, ServiceAccountCreate, Provider
from app.api.routes.login import get_provider_current
from app.services.service_account import service_account_service

router = APIRouter(tags=["service-accounts"])

@router.post("/service-accounts/", response_model=StandardResponse[ServiceAccount], status_code=status.HTTP_201_CREATED)
def create_service_account(data: ServiceAccountCreate, session: SessionDep, provider: Provider = Depends(get_provider_current), token: TokenDep = None):
    return StandardResponse(data=service_account_service.create_account(session, data, provider.id))


@router.get("/service-accounts/", response_model=StandardResponse[list[ServiceAccount]])
def get_service_accounts(session: SessionDep, provider: Provider = Depends(get_provider_current)):
    return StandardResponse(data=service_account_service.get_accounts_for_provider(session, provider.id))


@router.get("/service-accounts/{service_account_id}/", response_model=StandardResponse[ServiceAccount])
def get_service_account(service_account_id: int, session: SessionDep, provider: Provider = Depends(get_provider_current), token: TokenDep = None):
    return StandardResponse(data=service_account_service.get_account(session, service_account_id, provider.id))


@router.patch("/service-accounts/{service_account_id}/", response_model=StandardResponse[ServiceAccount], status_code=status.HTTP_201_CREATED)
def update_service_account(service_account_id: int, data: ServiceAccountUpdate, session: SessionDep, provider: Provider = Depends(get_provider_current), token: TokenDep = None):
    return StandardResponse(data=service_account_service.update_account(session, service_account_id, data, provider.id))


@router.delete("/service-accounts/{service_account_id}/", status_code=status.HTTP_204_NO_CONTENT)
def delete_service_account(service_account_id: int, session: SessionDep, provider: Provider = Depends(get_provider_current), token: TokenDep = None):
    service_account_service.delete_account(session, service_account_id, provider.id)
    return StandardResponse(message="Ok")


@router.get("/clients/{client_id}/service-accounts/", response_model=StandardResponse[list[ServiceAccount]])
def get_client_service_accounts(client_id: int, session: SessionDep, provider: Provider = Depends(get_provider_current), token: TokenDep = None):
    return StandardResponse(data=service_account_service.get_accounts_by_client(session, client_id, provider.id))
