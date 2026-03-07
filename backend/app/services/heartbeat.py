from datetime import datetime, timezone
from sqlmodel import Session
from app.repositories.heartbeat import heartbeat_repository
from app.models.heartbeat import HeartBeat
from app.core.exceptions import NotFoundException

class HeartBeatService:
    @staticmethod
    def update_heartbeat(session: Session) -> HeartBeat:
        hb = heartbeat_repository.get_heartbeat(session)
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

    @staticmethod
    def get_heartbeat(session: Session) -> HeartBeat:
        hb = heartbeat_repository.get_heartbeat(session)
        if not hb:
            raise NotFoundException(detail="Heartbeat not found")
        return hb

heartbeat_service = HeartBeatService()
