from datetime import datetime, timezone
from sqlmodel import Field, SQLModel 

class HeartBeat(SQLModel, table=True):
    __tablename__ = "heartbeat"

    id: int = Field(primary_key=True, default=1)  
    number: int = Field(default=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime | None = None

