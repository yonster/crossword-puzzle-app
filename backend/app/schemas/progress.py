from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict

class ProgressUpdate(BaseModel):
    puzzle_id: int
    current_state: Dict  # Grid state as dictionary
    completion_percentage: float
    completion_time: Optional[int] = None
    score: Optional[int] = None

class Progress(BaseModel):
    id: int
    user_id: int
    puzzle_id: int
    current_state: Optional[str]
    completion_percentage: float
    completion_time: Optional[int]
    score: int
    is_completed: bool
    started_at: datetime
    completed_at: Optional[datetime]
    last_played: Optional[datetime]
    
    class Config:
        from_attributes = True