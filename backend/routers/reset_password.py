from datetime import datetime, timedelta, timezone
from jinja2 import Environment, FileSystemLoader, select_autoescape
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from uuid import uuid4
from fastapi import APIRouter, HTTPException
from jose import ExpiredSignatureError, JWTError
import jwt
from sqlmodel import select, update
from app.config import settings
from app.db import SessionDep
from models import Provider, PasswordResetTokens, ForgotPasswordRequest, ResetPasswordRequest
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

from routers.providers import hash_password


router = APIRouter(tags=["reset-password"])

configuration = sib_api_v3_sdk.Configuration()
configuration.api_key["api-key"] = settings.BREVO_API_KEY
api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
    sib_api_v3_sdk.ApiClient(configuration)
)


def create_password_reset_token(
    data: dict,
    session: SessionDep,
    time_expire: timedelta | None = None
):
    data_copy = data.copy()

    expire = datetime.now(timezone.utc) + (time_expire or timedelta(minutes=15))

    jti = str(uuid4())
    data_copy.update({
        "exp": expire,
        "type": "password_reset",
        "jti": jti,
    })

    token_reset_jwt = jwt.encode(
        data_copy,
        key=settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    session.exec(
        update(PasswordResetTokens)
        .where(PasswordResetTokens.username == data_copy["sub"])
        .values(used=True)
    )

    data_token = {
        "username": data_copy["sub"],
        "jti": jti,
        "expires_at": expire,
        "used": False,
    }

    token_db = PasswordResetTokens.model_validate(data_token)
    session.add(token_db)
    session.commit()
    session.refresh(token_db)

    return token_reset_jwt



env = Environment(
    loader=FileSystemLoader("app/templates/email"),
    autoescape=select_autoescape(['html', 'xml'])
)

async def send_email(to_email: str, to_name: str, token: str):
    reset_link = f"{settings.FRONTEND_URL}reset-password?token={token}"
    
    try:
        # 1. Cargar y renderizar el template (Reemplaza 'reset_password.html' por tu nombre de archivo)
        template = env.get_template("email.html")
        html_content = template.render(
            reset_link=reset_link,
            year=datetime.now(timezone.utc).year
        )

        # 2. Configurar el mensaje para Gmail
        message = MIMEMultipart("alternative")
        message["Subject"] = "Password reset request"
        message["From"] = f"Volco <{settings.EMAIL_USER}>"
        message["To"] = to_email
        
        # Adjuntar el HTML renderizado
        message.attach(MIMEText(html_content, "html"))

        # 3. Envío mediante el servidor SMTP de Gmail
        with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
            server.starttls()  # Inicia conexión segura
            server.login(settings.EMAIL_USER, settings.EMAIL_PASSWORD)
            server.sendmail(settings.EMAIL_USER, to_email, message.as_string())

        return {"message": "Email sent"}

    except Exception as e:
        # Captura errores de Jinja2 o de SMTP
        raise HTTPException(status_code=500, detail=f"Error al enviar el correo: {str(e)}")


def is_token_expired(token: str) -> bool:
    try:
        jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return False
    except ExpiredSignatureError:
        return True
    except Exception:
        return True


@router.post("/forgot-password/")
async def forgot_password(request: ForgotPasswordRequest, session: SessionDep):
    if not request.email:
        raise HTTPException(status_code=400, detail="You must provide the email")
    
    provider = session.exec(select(Provider).where(Provider.email == request.email)).first()

    if not provider:
        raise HTTPException(status_code=404, detail="Provider not fount")

    token = create_password_reset_token(
        session=session,
        data={"sub": provider.username},
        time_expire=timedelta(minutes=15),
    )
    await send_email(to_email=request.email, to_name=provider.name, token=token)
    return {"msg": "Email sent"}


@router.post("/reset-password/")
def reset_password(request: ResetPasswordRequest, session: SessionDep):
    token = request.token
    password = request.password
    
    if is_token_expired(token=token):
        raise HTTPException(status_code=400, detail="Expired token")

    try:
        token_decoded = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        username = token_decoded.get("sub")
        jti = token_decoded.get("jti")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid token")

    if not username:
        raise HTTPException(status_code=400, detail="Token missing username")

    if not jti:
        raise HTTPException(status_code=400, detail="Token missing jti")

    # Buscar por jti, NO por username
    token_data_db = session.exec(
        select(PasswordResetTokens).where(PasswordResetTokens.jti == jti)
    ).first()

    if not token_data_db:
        raise HTTPException(status_code=400, detail="Token not registered")

    if token_data_db.used:
        raise HTTPException(status_code=400, detail="Token already used")

    if token_data_db.username != username:
        raise HTTPException(status_code=400, detail="Token does not match user")

    provider = session.exec(
        select(Provider).where(Provider.username == username)
    ).first()

    if not provider:
        raise HTTPException(status_code=404, detail="User not found")

    provider.password = hash_password(password)
    token_data_db.used = True

    session.add(provider)
    session.add(token_data_db)
    session.commit()

    return {"detail": "Password updated successfully"}

