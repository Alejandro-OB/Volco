from app.repositories.base import CRUDBase
from app.models.login import PasswordResetTokens
from sqlmodel import Session, select
from typing import Optional, Dict, Any

class PasswordResetTokenRepository(CRUDBase[PasswordResetTokens, Dict[str, Any], Dict[str, Any]]):
    def get_by_jti(self, session: Session, *, jti: str) -> Optional[PasswordResetTokens]:
        statement = select(PasswordResetTokens).where(PasswordResetTokens.jti == jti)
        return session.exec(statement).first()

password_reset_token_repository = PasswordResetTokenRepository(PasswordResetTokens)
