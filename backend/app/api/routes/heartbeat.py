from app.api.responses import StandardResponse
from fastapi import APIRouter
from app.core.database import SessionDep
from app.models import HeartBeat
from app.services.heartbeat import heartbeat_service

router = APIRouter(tags=["heartbeat"])

@router.post("/heartbeat/", response_model=StandardResponse[HeartBeat])
def update_heartbeat(session: SessionDep):
    return StandardResponse(data=heartbeat_service.update_heartbeat(session))

@router.get("/heartbeat/", response_model=StandardResponse[HeartBeat])
def get_heartbeat(session: SessionDep):
    return StandardResponse(data=heartbeat_service.get_heartbeat(session))
