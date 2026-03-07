from sqlmodel import Field
from app.schemas.login import PasswordResetTokensBase

class PasswordResetTokens(PasswordResetTokensBase, table=True):
    __tablename__ = "password_reset_tokens"
    pass