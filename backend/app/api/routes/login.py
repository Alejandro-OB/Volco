from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from app.core.database import SessionDep
from app.api.deps import TokenDep
from app.models import Provider
from app.services.login import login_service

router = APIRouter(tags=["login"])

def get_provider_current(session: SessionDep, token: TokenDep) -> Provider:
    return login_service.get_current_provider(session, token)


@router.post("/token/refresh/")
def refresh_token(refresh_token: dict):
    return login_service.refresh_access_token(refresh_token["refresh"])


@router.post("/token/")
def login(session: SessionDep, form_data: OAuth2PasswordRequestForm = Depends()):
    provider = login_service.authenticate_provider(
        session=session, username=form_data.username, password=form_data.password
    )
    return login_service.login_for_tokens(provider)
