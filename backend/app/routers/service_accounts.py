from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select

from app.db import SessionDep
from app.dependencies import TokenDep
from app.models import (
    ServiceAccountUpdate,
    ServiceAccount,
    ServiceAccountCreate,
    Client,
    Provider
)
from app.routers.login import get_provider_current

router = APIRouter(tags=["service-accounts"])


@router.post(
    "/service-accounts/",
    response_model=ServiceAccount,
    status_code=status.HTTP_201_CREATED,
)
def create_service_account(
    data: ServiceAccountCreate, session: SessionDep, token: TokenDep
):
    service_account = ServiceAccount.model_validate(data.model_dump())
    session.add(service_account)
    session.commit()
    session.refresh(service_account)
    return service_account


@router.get("/service-accounts/", response_model=list[ServiceAccount])
def get_service_accounts(session: SessionDep, provider: Provider = Depends(get_provider_current)):
    query = (
                select(ServiceAccount)
                .join(Client, ServiceAccount.client_id == Client.id)
                .where(Client.provider_id == provider.id)
            )
    return session.exec(query).all()

@router.get("/service-accounts/{service_account_id}/", response_model=ServiceAccount)
def get_service_account(service_account_id: int, session: SessionDep, token: TokenDep):
    service_account = session.get(ServiceAccount, service_account_id)
    return service_account

@router.patch(
    "/service-accounts/{service_account_id}/",
    response_model=ServiceAccount,
    status_code=status.HTTP_201_CREATED,
)
def update_service_account(
    data: ServiceAccountUpdate,
    service_account_id: int,
    session: SessionDep,
    token: TokenDep,
):
    service_account = session.get(ServiceAccount, service_account_id)
    if not service_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Account not found"
        )
    data_dict = data.model_dump(exclude_unset=True)
    service_account.sqlmodel_update(data_dict)
    session.add(service_account)
    session.commit()
    session.refresh(service_account)
    return service_account


@router.delete(
    "/service-accounts/{service_account_id}/", status_code=status.HTTP_204_NO_CONTENT
)
def delete_service_account(
    service_account_id: int,
    session: SessionDep,
    token: TokenDep,
):
    service_account = session.get(ServiceAccount, service_account_id)
    if not service_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Account not found"
        )
    session.delete(service_account)
    session.commit()
    return {"detail": "Ok"}


@router.get(
    "/clients/{client_id}/service-accounts/", response_model=list[ServiceAccount]
)
def get_client_service_accounts(client_id: int, session: SessionDep, token: TokenDep):
    service_account = (
        session.exec(
            select(ServiceAccount).where(ServiceAccount.client_id==client_id)
        )
        .all()
    )
    if not service_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Account not found"
        )
    return service_account



