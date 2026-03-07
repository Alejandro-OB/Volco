from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.exc import OperationalError
from app.api.routes import clients, providers, login, service_accounts, services, materials, invoices, invoice_customization, reset_password, heartbeat
from app.api.responses import ErrorResponse
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
            return JSONResponse(
                status_code=503,
                content=ErrorResponse(
                    success=False,
                    message="Service Unavailable",
                    details="Supabase is currently overloaded. Please try again in a moment."
                ).model_dump()
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

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            success=False,
            message=str(exc.detail),
            details=None
        ).model_dump()
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(
            success=False,
            message="Validation Error",
            details=exc.errors()
        ).model_dump()
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            success=False,
            message="Internal Server Error",
            details=str(exc)
        ).model_dump()
    )