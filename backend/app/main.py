from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.exc import OperationalError
from app.routers import clients, providers, login, service_accounts, services, materials, invoices, invoice_customization, reset_password, heartbeat
#from .config import settings


app = FastAPI()
app.include_router(clients.router)
app.include_router(providers.router)
app.include_router(login.router)
app.include_router(service_accounts.router)
app.include_router(services.router)
app.include_router(materials.router)
app.include_router(invoices.router)
app.include_router(invoice_customization.router)
app.include_router(reset_password.router)
app.include_router(heartbeat.router)

class DBExceptionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        try:
            return await call_next(request)
        except OperationalError:
            # Error del pool de Supabase
            raise HTTPException(
                status_code=503,
                detail="Supabase is currently overloaded. Please try again in a moment."
            )
        except Exception as e:
            raise e

app.add_middleware(DBExceptionMiddleware)

app.add_middleware(
    CORSMiddleware,
    #allow_origins=[settings.FRONTEND_URL],  
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)