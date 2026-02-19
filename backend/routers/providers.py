from fastapi import APIRouter, HTTPException
from app.db import SessionDep
from app.dependencies import TokenDep
from models import Provider, ProviderCreate, ProviderRead, ProviderUpdate
from fastapi import status
from passlib.context import CryptContext
from routers.login import check_password

router = APIRouter(tags=["providers"])
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str) -> str:
    if not isinstance(password, str):
        raise ValueError("Password debe ser un string")
    return pwd_context.hash(password)


@router.post(
    "/providers/", response_model=ProviderRead, status_code=status.HTTP_201_CREATED
)
def create_provider(session: SessionDep, data: ProviderCreate):
    provider = Provider.model_validate(data.model_dump())
    hashed_password = hash_password(provider.password)
    provider.password = hashed_password
    session.add(provider)
    session.commit()
    session.refresh(provider)
    return provider


@router.patch("/providers/{provider_id}/", response_model=Provider)
def update_provider(
    provider_id: int, data: ProviderUpdate, session: SessionDep, token: TokenDep
):
    provider = session.get(Provider, provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    data_dict = data.model_dump(exclude_unset=True)

    old_password = data_dict.get("old_password")
    new_password = data_dict.get("password")

    if new_password:
        if not old_password:
            raise HTTPException(
                status_code=400,
                detail="You must provide the current password to change it.",
            )

        if not check_password(old_password, provider.password):
            raise HTTPException(
                status_code=401, detail="The current password you entered is incorrect."
            )

        provider.password = hash_password(new_password)

        data_dict.pop("old_password", None)

    data_dict.pop("password", None)

    provider.sqlmodel_update(data_dict)

    session.add(provider)
    session.commit()
    session.refresh(provider)

    return provider

@router.get("/providers/{provider_id}/", response_model=ProviderRead)
def get_provider(provider_id: int, session: SessionDep, token: TokenDep):
    provider = session.get(Provider, provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    return provider