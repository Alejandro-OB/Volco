from typing import Annotated
from fastapi import Depends
from sqlmodel import Session, create_engine
from app.core.config import settings


DATABASE_URL = settings.DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    pool_size=1,          # Máximo 1 conexión en pool
    max_overflow=0,       # No permitir conexiones extra
    pool_timeout=30,
    pool_recycle=1800,    # Recicla conexiones cada 30m
    pool_pre_ping=True    # Detecta conexiones muertas
)

def get_session():
    with Session(engine) as session:
        yield session


    
SessionDep = Annotated[Session, Depends(get_session)]

