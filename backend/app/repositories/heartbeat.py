from app.repositories.base import CRUDBase
from app.models.heartbeat import HeartBeat
from sqlmodel import Session
from typing import Optional, Dict, Any

class HeartBeatRepository(CRUDBase[HeartBeat, Dict[str, Any], Dict[str, Any]]):
    def get_heartbeat(self, session: Session) -> Optional[HeartBeat]:
        return session.get(HeartBeat, 1)

heartbeat_repository = HeartBeatRepository(HeartBeat)
