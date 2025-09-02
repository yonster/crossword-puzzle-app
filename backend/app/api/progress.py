from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import json

from ..database import get_db
from ..models import user_progress as progress_model, puzzle as puzzle_model
from ..schemas import progress as progress_schema
from ..api.auth import get_current_user
from ..models.user import User

router = APIRouter()

@router.post("/", response_model=progress_schema.Progress)
def save_progress(
    progress: progress_schema.ProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if puzzle exists
    puzzle = db.query(puzzle_model.Puzzle).filter(puzzle_model.Puzzle.id == progress.puzzle_id).first()
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle not found")
    
    # Find or create progress record
    db_progress = db.query(progress_model.UserProgress).filter(
        progress_model.UserProgress.user_id == current_user.id,
        progress_model.UserProgress.puzzle_id == progress.puzzle_id
    ).first()
    
    if not db_progress:
        db_progress = progress_model.UserProgress(
            user_id=current_user.id,
            puzzle_id=progress.puzzle_id
        )
        db.add(db_progress)
    
    # Update progress
    db_progress.current_state = json.dumps(progress.current_state)
    db_progress.completion_percentage = progress.completion_percentage
    
    if progress.completion_time:
        db_progress.completion_time = progress.completion_time
    
    if progress.score:
        db_progress.score = progress.score
    
    # Check if completed
    if progress.completion_percentage >= 100:
        db_progress.is_completed = True
        db_progress.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_progress)
    
    return db_progress

@router.get("/{puzzle_id}", response_model=progress_schema.Progress)
def get_progress(
    puzzle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    progress = db.query(progress_model.UserProgress).filter(
        progress_model.UserProgress.user_id == current_user.id,
        progress_model.UserProgress.puzzle_id == puzzle_id
    ).first()
    
    if not progress:
        raise HTTPException(status_code=404, detail="No progress found for this puzzle")
    
    return progress

@router.get("/user/all")
def get_user_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    progress_list = db.query(progress_model.UserProgress).filter(
        progress_model.UserProgress.user_id == current_user.id
    ).all()
    
    return progress_list