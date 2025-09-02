from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Dict
from enum import Enum

class Direction(str, Enum):
    ACROSS = "ACROSS"
    DOWN = "DOWN"

class PuzzleCell(BaseModel):
    row: int
    col: int
    solution: Optional[str] = Field(None, max_length=1)
    number: Optional[int] = None
    is_black_square: bool = False
    
    class Config:
        from_attributes = True

class Clue(BaseModel):
    number: int
    direction: Direction
    text: str
    answer: str
    
    class Config:
        from_attributes = True

class PuzzleCreate(BaseModel):
    title: str
    grid_size: int = Field(ge=5, le=25)
    difficulty: Optional[str] = None
    description: Optional[str] = None
    cells: List[PuzzleCell]
    clues: List[Clue]

class Puzzle(BaseModel):
    id: int
    title: str
    author_id: int
    grid_size: int
    difficulty: Optional[str]
    description: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    cells: List[PuzzleCell]
    clues: List[Clue]
    
    class Config:
        from_attributes = True

class PuzzleWithProgress(Puzzle):
    user_progress: Optional[Dict] = None