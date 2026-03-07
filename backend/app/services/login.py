from sqlmodel import Session
from app.api.deps import TokenDep
from app.repositories.provider import provider_repository
from app.models.providers import Provider
from app.core.exceptions import UnauthorizedException
from app.core.security import check_password, create_token
from datetime import timedelta
from jose import jwt, JWTError
from app.core.config import settings

class LoginService:
    @staticmethod
    def authenticate_provider(session: Session, username: str, password: str) -> Provider:
        provider = provider_repository.get_by_username(session, username=username)
        if not provider:
            raise UnauthorizedException(detail="Could not validate credentials")
            
        if not check_password(password, provider.password):
            raise UnauthorizedException(detail="Could not validate credentials")
            
        return provider

    @staticmethod
    def get_current_provider(session: Session, token: str) -> Provider:
        try:
            token_decode = jwt.decode(
                token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )
            username = token_decode.get("sub")
            if username is None:
                raise UnauthorizedException(detail="Could not validate credentials")
        except JWTError:
            raise UnauthorizedException(detail="Could not validate credentials")
            
        provider = provider_repository.get_by_username(session, username=username)
        if not provider:
            raise UnauthorizedException(detail="Could not validate credentials")
            
        return provider

    @staticmethod
    def login_for_tokens(provider: Provider) -> dict:
        access_token = create_token({"sub": provider.username, "provider_id": provider.id}, timedelta(minutes=30))
        refresh_token = create_token({"sub": provider.username, "provider_id": provider.id}, timedelta(days=7))
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    @staticmethod
    def refresh_access_token(refresh_token: str) -> dict:
        try:
            token_decode = jwt.decode(
                refresh_token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM],
            )
            username = token_decode.get("sub")
            id = token_decode.get("provider_id")
            if username is None:
                raise UnauthorizedException(detail="Could not validate credentials")

            new_access_token = create_token({"sub": username, "provider_id": id}, timedelta(minutes=30))
            return {"access_token": new_access_token}
        except JWTError:
            raise UnauthorizedException(detail="Could not validate credentials")

login_service = LoginService()
