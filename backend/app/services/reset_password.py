from datetime import datetime, timedelta, timezone
from jinja2 import Environment, FileSystemLoader, select_autoescape
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from uuid import uuid4
from jose import ExpiredSignatureError, JWTError
import jwt
from sqlmodel import Session, update

from app.core.config import settings
from app.models.login import PasswordResetTokens
from app.schemas.login import ForgotPasswordRequest, ResetPasswordRequest
from app.repositories.provider import provider_repository
from app.repositories.reset_password import password_reset_token_repository
from app.core.security import hash_password
from app.core.exceptions import BadRequestException, NotFoundException

env = Environment(
    loader=FileSystemLoader("app/templates/email"),
    autoescape=select_autoescape(['html', 'xml'])
)

class ResetPasswordService:
    @staticmethod
    def create_password_reset_token(session: Session, username: str, time_expire: timedelta | None = None) -> str:
        expire = datetime.now(timezone.utc) + (time_expire or timedelta(minutes=15))
        jti = str(uuid4())
        
        data_copy = {
            "sub": username,
            "exp": expire,
            "type": "password_reset",
            "jti": jti,
        }

        token_reset_jwt = jwt.encode(data_copy, key=settings.SECRET_KEY, algorithm=settings.ALGORITHM)

        # Mark previous tokens as used
        session.exec(
            update(PasswordResetTokens)
            .where(PasswordResetTokens.username == username)
            .values(used=True)
        )

        data_token = {
            "username": username,
            "jti": jti,
            "expires_at": expire,
            "used": False,
        }

        token_db = PasswordResetTokens.model_validate(data_token)
        session.add(token_db)
        session.commit()
        session.refresh(token_db)

        return token_reset_jwt

    @staticmethod
    async def send_email(to_email: str, to_name: str, token: str):
        reset_link = f"{settings.FRONTEND_URL}reset-password?token={token}"
        try:
            template = env.get_template("email.html")
            html_content = template.render(
                reset_link=reset_link,
                year=datetime.now(timezone.utc).year
            )

            message = MIMEMultipart("alternative")
            message["Subject"] = "Password reset request"
            message["From"] = f"Volco <{settings.EMAIL_USER}>"
            message["To"] = to_email
            
            message.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
                server.starttls()
                server.login(settings.EMAIL_USER, settings.EMAIL_PASSWORD)
                server.sendmail(settings.EMAIL_USER, to_email, message.as_string())

        except Exception as e:
            raise BadRequestException(detail=f"Error al enviar el correo: {str(e)}")

    @staticmethod
    def is_token_expired(token: str) -> bool:
        try:
            jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            return False
        except ExpiredSignatureError:
            return True
        except Exception:
            return True

    @staticmethod
    async def process_forgot_password(session: Session, request: ForgotPasswordRequest):
        if not request.email:
            raise BadRequestException(detail="You must provide the email")
        
        provider = provider_repository.get_by_email(session, email=request.email)
        if not provider:
            # Return silently to prevent user enumeration
            return

        token = ResetPasswordService.create_password_reset_token(
            session=session,
            username=provider.username,
            time_expire=timedelta(minutes=15),
        )
        await ResetPasswordService.send_email(to_email=request.email, to_name=provider.name, token=token)

    @staticmethod
    def process_reset_password(session: Session, request: ResetPasswordRequest):
        token = request.token
        password = request.password
        
        if ResetPasswordService.is_token_expired(token=token):
            raise BadRequestException(detail="Expired token")

        try:
            token_decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            username = token_decoded.get("sub")
            jti = token_decoded.get("jti")
        except JWTError:
            raise BadRequestException(detail="Invalid token")

        if not username or not jti:
            raise BadRequestException(detail="Token missing username or jti")

        token_data_db = password_reset_token_repository.get_by_jti(session, jti=jti)
        if not token_data_db:
            raise BadRequestException(detail="Token not registered")
        if token_data_db.used:
            raise BadRequestException(detail="Token already used")
        if token_data_db.username != username:
            raise BadRequestException(detail="Token does not match user")

        provider = provider_repository.get_by_username(session, username=username)
        if not provider:
            raise NotFoundException(detail="User not found")

        provider.password = hash_password(password)
        token_data_db.used = True

        session.add(provider)
        session.add(token_data_db)
        session.commit()

reset_password_service = ResetPasswordService()
