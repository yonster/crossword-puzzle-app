from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class UserProgress(Base):
    __tablename__ = "user_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    puzzle_id = Column(Integer, ForeignKey("puzzles.id"), nullable=False)
    current_state = Column(Text)  # JSON string storing the current grid state
    completion_percentage = Column(Float, default=0.0)
    completion_time = Column(Integer)  # Time in seconds
    score = Column(Integer, default=0)
    is_completed = Column(Boolean, default=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    last_played = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", back_populates="progress")
    puzzle = relationship("Puzzle", back_populates="user_progress")