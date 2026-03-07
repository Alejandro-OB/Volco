from fastapi import APIRouter
from app.core.database import SessionDep
from app.schemas.login import ForgotPasswordRequest, ResetPasswordRequest
from app.services.reset_password import reset_password_service
from app.api.responses import StandardResponse

router = APIRouter(tags=["reset-password"])

@router.post("/forgot-password/")
async def forgot_password(request: ForgotPasswordRequest, session: SessionDep):
    await reset_password_service.process_forgot_password(session, request)
    return StandardResponse(message="Email sent")

@router.post("/reset-password/")
def reset_password(request: ResetPasswordRequest, session: SessionDep):
    reset_password_service.process_reset_password(session, request)
    return StandardResponse(message="Password updated successfully")
