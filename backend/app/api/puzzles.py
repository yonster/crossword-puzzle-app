from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from sqlalchemy.orm import Session, selectinload
from typing import List, Optional
import json

from ..database import get_db
from ..models import puzzle as puzzle_model, user as user_model, user_progress as progress_model
from ..schemas import puzzle as puzzle_schema
from ..api.auth import get_current_user
from ..utils import parse_puz_file, export_to_puz, parse_nyt_format, export_to_nyt

router = APIRouter()

@router.get("/", response_model=List[puzzle_schema.Puzzle])
def get_puzzles(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    puzzles = db.query(puzzle_model.Puzzle).options(
        selectinload(puzzle_model.Puzzle.cells),
        selectinload(puzzle_model.Puzzle.clues)
    ).offset(skip).limit(limit).all()
    return puzzles

@router.get("/{puzzle_id}", response_model=puzzle_schema.PuzzleWithProgress)
def get_puzzle(puzzle_id: int, db: Session = Depends(get_db)):
    puzzle = db.query(puzzle_model.Puzzle).options(
        selectinload(puzzle_model.Puzzle.cells),
        selectinload(puzzle_model.Puzzle.clues)
    ).filter(puzzle_model.Puzzle.id == puzzle_id).first()
    
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle not found")
    
    # For now, return without user progress
    # TODO: Add authentication and progress tracking
    puzzle_dict = puzzle.__dict__.copy()
    puzzle_dict["user_progress"] = None
    
    return puzzle_dict

@router.post("/", response_model=puzzle_schema.Puzzle)
def create_puzzle(
    puzzle: puzzle_schema.PuzzleCreate,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    # Validate grid size
    if puzzle.grid_size < 5 or puzzle.grid_size > 25:
        raise HTTPException(status_code=400, detail="Grid size must be between 5 and 25")
    
    # Create puzzle
    db_puzzle = puzzle_model.Puzzle(
        title=puzzle.title,
        author_id=current_user.id,
        grid_size=puzzle.grid_size,
        difficulty=puzzle.difficulty,
        description=puzzle.description
    )
    db.add(db_puzzle)
    db.commit()
    db.refresh(db_puzzle)
    
    # Add cells
    for cell in puzzle.cells:
        db_cell = puzzle_model.PuzzleCell(
            puzzle_id=db_puzzle.id,
            row=cell.row,
            col=cell.col,
            solution=cell.solution,
            number=cell.number,
            is_black_square=cell.is_black_square
        )
        db.add(db_cell)
    
    # Add clues
    for clue in puzzle.clues:
        db_clue = puzzle_model.Clue(
            puzzle_id=db_puzzle.id,
            number=clue.number,
            direction=clue.direction,
            text=clue.text,
            answer=clue.answer
        )
        db.add(db_clue)
    
    db.commit()
    db.refresh(db_puzzle)
    
    return db_puzzle

@router.post("/import")
async def import_puzzle(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    # Read file content
    content = await file.read()
    
    # Parse based on file type
    if file.filename.endswith('.puz'):
        puzzle_data = parse_puz_file(content)
    elif file.filename.endswith('.json'):
        puzzle_data = parse_nyt_format(content.decode('utf-8'))
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format")
    
    # Create puzzle from parsed data
    puzzle_create = puzzle_schema.PuzzleCreate(**puzzle_data)
    return create_puzzle(puzzle_create, db, current_user)

@router.get("/{puzzle_id}/export/{format}")
def export_puzzle(
    puzzle_id: int,
    format: str,
    db: Session = Depends(get_db)
):
    puzzle = db.query(puzzle_model.Puzzle).filter(puzzle_model.Puzzle.id == puzzle_id).first()
    
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle not found")
    
    # Prepare puzzle data
    puzzle_data = {
        "title": puzzle.title,
        "grid_size": puzzle.grid_size,
        "difficulty": puzzle.difficulty,
        "description": puzzle.description,
        "cells": [{"row": c.row, "col": c.col, "solution": c.solution, 
                  "number": c.number, "is_black_square": c.is_black_square} 
                 for c in puzzle.cells],
        "clues": [{"number": c.number, "direction": c.direction.value, 
                  "text": c.text, "answer": c.answer} 
                 for c in puzzle.clues]
    }
    
    if format == "puz":
        content = export_to_puz(puzzle_data)
        media_type = "application/octet-stream"
        filename = f"{puzzle.title}.puz"
    elif format == "nyt":
        content = export_to_nyt(puzzle_data)
        media_type = "application/json"
        filename = f"{puzzle.title}.json"
    else:
        raise HTTPException(status_code=400, detail="Unsupported export format")
    
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )