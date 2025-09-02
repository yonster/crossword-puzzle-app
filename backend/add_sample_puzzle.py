#!/usr/bin/env python3

import sys
sys.path.append('.')

from app.database import SessionLocal, engine
from app.models import User, Puzzle, PuzzleCell, Clue
from app.models.puzzle import Direction
from datetime import datetime

def create_sample_puzzle():
    db = SessionLocal()
    
    try:
        # Create a user first
        user = User(
            username="admin",
            email="admin@example.com",
            hashed_password="$2b$12$dummy_hash"  # dummy hash for testing
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create a simple 5x5 puzzle
        puzzle = Puzzle(
            title="Sample 5x5 Puzzle",
            author_id=user.id,
            grid_size=5,
            difficulty="Easy"
        )
        db.add(puzzle)
        db.commit()
        db.refresh(puzzle)
        
        # Create cells - simple pattern with some black squares
        cells_data = [
            # Row 0
            {"row": 0, "col": 0, "solution": "C", "number": 1, "is_black": False},
            {"row": 0, "col": 1, "solution": "A", "number": None, "is_black": False},
            {"row": 0, "col": 2, "solution": "T", "number": None, "is_black": False},
            {"row": 0, "col": 3, "solution": None, "number": None, "is_black": True},
            {"row": 0, "col": 4, "solution": "D", "number": 2, "is_black": False},
            # Row 1
            {"row": 1, "col": 0, "solution": "A", "number": 3, "is_black": False},
            {"row": 1, "col": 1, "solution": "R", "number": None, "is_black": False},
            {"row": 1, "col": 2, "solution": "E", "number": None, "is_black": False},
            {"row": 1, "col": 3, "solution": None, "number": None, "is_black": True},
            {"row": 1, "col": 4, "solution": "O", "number": None, "is_black": False},
            # Row 2
            {"row": 2, "col": 0, "solution": "R", "number": None, "is_black": False},
            {"row": 2, "col": 1, "solution": "E", "number": None, "is_black": False},
            {"row": 2, "col": 2, "solution": "D", "number": None, "is_black": False},
            {"row": 2, "col": 3, "solution": None, "number": None, "is_black": True},
            {"row": 2, "col": 4, "solution": "G", "number": None, "is_black": False},
            # Row 3
            {"row": 3, "col": 0, "solution": None, "number": None, "is_black": True},
            {"row": 3, "col": 1, "solution": "A", "number": 4, "is_black": False},
            {"row": 3, "col": 2, "solution": "G", "number": None, "is_black": False},
            {"row": 3, "col": 3, "solution": "E", "number": None, "is_black": False},
            {"row": 3, "col": 4, "solution": None, "number": None, "is_black": True},
            # Row 4
            {"row": 4, "col": 0, "solution": "S", "number": 5, "is_black": False},
            {"row": 4, "col": 1, "solution": "U", "number": None, "is_black": False},
            {"row": 4, "col": 2, "solution": "N", "number": None, "is_black": False},
            {"row": 4, "col": 3, "solution": None, "number": None, "is_black": True},
            {"row": 4, "col": 4, "solution": "S", "number": 6, "is_black": False}
        ]
        
        for cell_data in cells_data:
            cell = PuzzleCell(
                puzzle_id=puzzle.id,
                row=cell_data["row"],
                col=cell_data["col"],
                solution=cell_data["solution"],
                number=cell_data["number"],
                is_black_square=cell_data["is_black"]
            )
            db.add(cell)
        
        # Create clues
        clues_data = [
            {"number": 1, "direction": Direction.ACROSS, "text": "Feline animal", "answer": "CAT"},
            {"number": 2, "direction": Direction.DOWN, "text": "Canine animal", "answer": "DOG"},
            {"number": 3, "direction": Direction.ACROSS, "text": "Take care of", "answer": "ARE"},
            {"number": 4, "direction": Direction.ACROSS, "text": "Years lived", "answer": "AGE"},
            {"number": 5, "direction": Direction.ACROSS, "text": "Hot star", "answer": "SUN"},
            {"number": 6, "direction": Direction.DOWN, "text": "Bright star", "answer": "S"}
        ]
        
        for clue_data in clues_data:
            clue = Clue(
                puzzle_id=puzzle.id,
                number=clue_data["number"],
                direction=clue_data["direction"],
                text=clue_data["text"],
                answer=clue_data["answer"]
            )
            db.add(clue)
        
        db.commit()
        print(f"Created sample puzzle with ID: {puzzle.id}")
        
    except Exception as e:
        db.rollback()
        print(f"Error creating sample puzzle: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_puzzle()