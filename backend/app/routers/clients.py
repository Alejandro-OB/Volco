from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies import TokenDep
from sqlmodel import select

from app.db import SessionDep
from app.routers.login import get_provider_current
from app.models import Client, ClientCreate, ClientUpdate, Provider

router = APIRouter(tags=["clients"])


@router.get("/clients/", response_model=list[Client])
def get_clients(
    session: SessionDep,
    token: TokenDep,
    provider: Provider = Depends(get_provider_current),
):
    provider_id = provider.id
    return session.exec(select(Client).where(Client.provider_id == provider_id)).all()


@router.post("/clients/", response_model=Client, status_code=status.HTTP_201_CREATED)
def create_client(
    session: SessionDep,
    data: ClientCreate,
    provider: Provider = Depends(get_provider_current),
):
    client = Client.model_validate(data.model_dump())
    client.provider_id = provider.id
    session.add(client)
    session.commit()
    session.refresh(client)
    return client


@router.get("/clients/{client_id}/", response_model=Client)
def get_client(
    client_id: int,
    token: TokenDep,
    session: SessionDep,
    provider: Provider = Depends(get_provider_current),
):
    client = session.exec(
        select(Client).where(Client.id == client_id).where(Client.provider_id == provider.id)
    ).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Client not found"
        )

    return client


@router.patch("/clients/{client_id}/", response_model=Client, status_code=status.HTTP_201_CREATED)
def update_client(
    client_id: int,
    data: ClientUpdate,
    session: SessionDep,
    token: TokenDep,
    provider: Provider = Depends(get_provider_current),
):
    client = session.exec(
        select(Client).where(Client.id == client_id).where(Client.provider_id == provider.id)
    ).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Client not Found"
        )
    data_dict = data.model_dump(exclude_unset=True)
    client.sqlmodel_update(data_dict)
    session.add(client)
    session.commit()
    session.refresh(client)
    return client


@router.delete("/clients/{client_id}/", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(
    client_id: int,
    session: SessionDep,
    token: TokenDep,
    provider: Provider = Depends(get_provider_current),
):
    client = session.exec(
        select(Client).where(Client.id == client_id).where(Client.provider_id == provider.id)
    ).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Client not found"
        )
    session.delete(client)
    session.commit()
    return {"detail": "Ok"}
