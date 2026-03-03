from datetime import datetime
from pydantic import BaseModel
from sqlmodel import Field, SQLModel

class PasswordResetTokensBase(SQLModel):
    __tablename__ = "password_reset_tokens"
    id: int | None = Field(primary_key=True, default=None, index=True)
    username: str = Field(max_length=100)
    jti: str
    expires_at: datetime
    used: bool | None = Field(default=False)

class PasswordResetTokens(PasswordResetTokensBase, table=True):
    pass

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    password: str
    token: str