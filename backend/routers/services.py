from fastapi import APIRouter, HTTPException, status, Depends
from sqlmodel import select

from app.db import SessionDep
from app.dependencies import TokenDep

from models import Service, ServiceCreate, ServiceUpdate, Provider, ServiceAccount, Client
from routers.login import get_provider_current

router = APIRouter(tags=["services"])


@router.get("/services/", response_model=list[Service])
def get_services(session: SessionDep, provider: Provider = Depends(get_provider_current)):
    query = (
        select(Service)
        .join(ServiceAccount, Service.service_account_id == ServiceAccount.id)
        .join(Client, ServiceAccount.client_id == Client.id)
        .where(Client.provider_id == provider.id)
    )
    return session.exec(query).all()


@router.post("/services/", response_model=Service, status_code=status.HTTP_201_CREATED)
def create_service(data: ServiceCreate, session: SessionDep, token: TokenDep):
    service = Service.model_validate(data.model_dump())
    service.total_amount = service.quantity * service.price
    session.add(service)
    session.commit()
    session.refresh(service)
    return service


@router.get("/services/{service_id}/", response_model=Service)
def get_service(service_id: int, session: SessionDep, token: TokenDep):
    service = session.get(Service, service_id)
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Service not found"
        )
    return service


@router.patch(
    "/services/{service_id}/",
    response_model=Service,
    status_code=status.HTTP_201_CREATED,
)
def update_service(service_id: int, data: ServiceUpdate, session: SessionDep, token: TokenDep):
    service = session.get(Service, service_id)
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Service not found"
        )
    
    data_dict = data.model_dump(exclude_unset=True)

    price = data_dict.get("price", service.price)
    quantity = data_dict.get("quantity", service.quantity)

    if price is not None and quantity is not None:
        data_dict["total_amount"] = price * quantity

    service.sqlmodel_update(data_dict)
    session.add(service)
    session.commit()
    session.refresh(service)
    return service


@router.delete("/services/{service_id}/", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(service_id: int, session: SessionDep, token: TokenDep):
    service = session.get(Service, service_id)
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Service not found"
        )
    session.delete(service)
    return {"detail": "ok"}


@router.get(
    "/account-services/{service_account_id}/services/", response_model=list[Service]
)
def get_services_by_service_account(
    service_account_id: int, session: SessionDep, token: TokenDep
):
    return session.exec(
        select(Service).where(Service.service_account_id == service_account_id)
    ).all()
