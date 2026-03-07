from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import jwt
from app.core.config import settings

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str) -> str:
    if not isinstance(password, str):
        raise ValueError("Password debe ser un string")
    return pwd_context.hash(password)

def check_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_token(data: dict, time_expire: timedelta | None):
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
