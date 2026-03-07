from app.api.responses import StandardResponse
from fastapi import APIRouter, Depends, status
from app.core.database import SessionDep
from app.api.deps import TokenDep
from app.models import Service, ServiceCreate, ServiceUpdate, Provider
from app.api.routes.login import get_provider_current
from app.services.service import service_service

router = APIRouter(tags=["services"])

@router.get("/services/", response_model=StandardResponse[list[Service]])
def get_services(session: SessionDep, provider: Provider = Depends(get_provider_current)):
    return StandardResponse(data=service_service.get_services_for_provider(session, provider.id))

@router.post("/services/", response_model=StandardResponse[Service], status_code=status.HTTP_201_CREATED)
def create_service(data: ServiceCreate, session: SessionDep, provider: Provider = Depends(get_provider_current), token: TokenDep = None):
    return StandardResponse(data=service_service.create_service(session, data, provider.id))

@router.get("/services/{service_id}/", response_model=StandardResponse[Service])
def get_service(service_id: int, session: SessionDep, provider: Provider = Depends(get_provider_current), token: TokenDep = None):
    return StandardResponse(data=service_service.get_service(session, service_id, provider.id))

@router.patch("/services/{service_id}/", response_model=StandardResponse[Service], status_code=status.HTTP_201_CREATED)
def update_service(service_id: int, data: ServiceUpdate, session: SessionDep, provider: Provider = Depends(get_provider_current), token: TokenDep = None):
    return StandardResponse(data=service_service.update_service(session, service_id, data, provider.id))

@router.delete("/services/{service_id}/", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(service_id: int, session: SessionDep, provider: Provider = Depends(get_provider_current), token: TokenDep = None):
    service_service.delete_service(session, service_id, provider.id)
    return StandardResponse(message="Ok")

@router.get("/account-services/{service_account_id}/services/", response_model=StandardResponse[list[Service]])
def get_services_by_service_account(service_account_id: int, session: SessionDep, provider: Provider = Depends(get_provider_current), token: TokenDep = None):
    return StandardResponse(data=service_service.get_services_by_service_account(session, service_account_id, provider.id))
