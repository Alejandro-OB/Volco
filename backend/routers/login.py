from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from passlib.context import CryptContext
from sqlmodel import select

from app.db import SessionDep
from app.dependencies import TokenDep
from models import Provider
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from app.config import settings

router = APIRouter(tags=["login"])

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

EXCEPTION_MSG = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_provider(session: SessionDep, username: str):
    query = select(Provider).where(Provider.username == username)
    provider = session.exec(query).first()
    if provider:
        return provider
    else:
        return None


def check_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def authenticate_provider(username, password, session: SessionDep):
    provider = get_provider(session=session, username=username)
    if not provider:
        raise EXCEPTION_MSG

    if not check_password(password, provider.password):
        raise EXCEPTION_MSG

    return provider


def create_token(data: dict, time_expire: datetime | None):
    data_copy = data.copy()
    if time_expire is None:
        expires = datetime.now(timezone.utc) + timedelta(minutes=15)
    else:
        expires = datetime.now(timezone.utc) + time_expire
    data_copy.update({"exp": expires})
    token_jwt = jwt.encode(
        data_copy, key=settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return token_jwt


def get_provider_current(session: SessionDep, token: TokenDep):
    try:
        token_decode = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        username = token_decode.get("sub")
        if username is None:
            raise EXCEPTION_MSG
    except JWTError:
        raise EXCEPTION_MSG
    provider = get_provider(session=session, username=username)
    if not provider:
        raise EXCEPTION_MSG
    return provider


@router.post("/token/refresh/")
def refresh_token(refresh_token: dict):
    try:
        token_decode = jwt.decode(
            refresh_token["refresh"],
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        username = token_decode.get("sub")
        id = token_decode.get("provider_id")
        if username is None:
            raise EXCEPTION_MSG

        new_access_token = create_token({"sub": username, "provider_id": id}, timedelta(minutes=30))
        return {"access_token": new_access_token}
    except JWTError:
        raise EXCEPTION_MSG


@router.post("/token/")
def login(session: SessionDep, form_data: OAuth2PasswordRequestForm = Depends()):
    provider = authenticate_provider(
        username=form_data.username, password=form_data.password, session=session
    )
    access_token = create_token({"sub": provider.username, "provider_id": provider.id}, timedelta(minutes=30))
    refresh_token = create_token({"sub": provider.username, "provider_id": provider.id}, timedelta(days=7))
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }
