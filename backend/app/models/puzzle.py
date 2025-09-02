from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..database import Base

class Direction(enum.Enum):
    ACROSS = "ACROSS"
    DOWN = "DOWN"

class Puzzle(Base):
    __tablename__ = "puzzles"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    grid_size = Column(Integer, nullable=False)  # Store as single value, assuming square grid
    difficulty = Column(String)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    author = relationship("User", back_populates="created_puzzles")
    cells = relationship("PuzzleCell", back_populates="puzzle", cascade="all, delete-orphan")
    clues = relationship("Clue", back_populates="puzzle", cascade="all, delete-orphan")
    user_progress = relationship("UserProgress", back_populates="puzzle", cascade="all, delete-orphan")

class PuzzleCell(Base):
    __tablename__ = "puzzle_cells"
    
    id = Column(Integer, primary_key=True, index=True)
    puzzle_id = Column(Integer, ForeignKey("puzzles.id"), nullable=False)
    row = Column(Integer, nullable=False)
    col = Column(Integer, nullable=False)
    solution = Column(String(1))  # Single character or empty for black squares
    number = Column(Integer)  # Cell number for clue reference
    is_black_square = Column(Boolean, default=False)
    
    puzzle = relationship("Puzzle", back_populates="cells")

class Clue(Base):
    __tablename__ = "clues"
    
    id = Column(Integer, primary_key=True, index=True)
    puzzle_id = Column(Integer, ForeignKey("puzzles.id"), nullable=False)
    number = Column(Integer, nullable=False)
    direction = Column(Enum(Direction), nullable=False)
    text = Column(Text, nullable=False)
    answer = Column(String, nullable=False)  # Store the answer for validation
    
    puzzle = relationship("Puzzle", back_populates="clues")