from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from app.db import SessionDep
from models import HeartBeat

router = APIRouter(tags=["heartbeat"])

@router.post("/heartbeat/", response_model=HeartBeat)
def update_heartbeat(session: SessionDep):

    hb = session.get(HeartBeat, 1)

    if hb is None:
        hb = HeartBeat(id=1, number=1)
        session.add(hb)
    else:
        hb.number += 1
        hb.updated_at = datetime.now(timezone.utc)

    session.add(hb)
    session.commit()
    session.refresh(hb)

    return hb

@router.get("/heartbeat/", response_model=HeartBeat)
def get_heartbeat(session: SessionDep):
    heartbeat = session.get(HeartBeat, 1)
    if not heartbeat:
        raise HTTPException(status_code=404, detail="Heartbeat not found")
    return heartbeat
