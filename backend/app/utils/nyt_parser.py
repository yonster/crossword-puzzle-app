import json
from typing import Dict, List, Any
from ..schemas.puzzle import Direction

def parse_nyt_format(json_content: str) -> Dict[str, Any]:
    """Parse NYT JSON format and return puzzle data."""
    data = json.loads(json_content)
    
    grid_size = data.get("size", {}).get("rows", 15)
    cells = []
    clues = []
    
    # Parse grid
    grid = data.get("grid", [])
    gridnums = data.get("gridnums", [])
    for idx, cell_value in enumerate(grid):
        row = idx // grid_size
        col = idx % grid_size
        
        # Handle both "." and None as black squares
        is_black = cell_value == "." or cell_value is None
        grid_num = gridnums[idx] if idx < len(gridnums) and gridnums[idx] > 0 else None
        
        cells.append({
            "row": row,
            "col": col,
            "solution": cell_value if not is_black else None,
            "number": grid_num,
            "is_black_square": is_black
        })
    
    # Parse clues - handle both formats
    clues_data = data.get("clues", {})
    answers_data = data.get("answers", {})
    
    # Get across clues and answers
    across_clues = clues_data.get("across", [])
    across_answers = answers_data.get("across", [])
    
    for i, clue_text in enumerate(across_clues):
        # Extract number from clue text (format: "1. Clue text")
        parts = clue_text.split(". ", 1)
        if len(parts) == 2:
            number, text = parts
            answer = across_answers[i] if i < len(across_answers) else ""
            clues.append({
                "number": int(number),
                "direction": Direction.ACROSS,
                "text": text,
                "answer": answer
            })
    
    # Get down clues and answers
    down_clues = clues_data.get("down", [])
    down_answers = answers_data.get("down", [])
    
    for i, clue_text in enumerate(down_clues):
        # Extract number from clue text (format: "1. Clue text")
        parts = clue_text.split(". ", 1)
        if len(parts) == 2:
            number, text = parts
            answer = down_answers[i] if i < len(down_answers) else ""
            clues.append({
                "number": int(number),
                "direction": Direction.DOWN,
                "text": text,
                "answer": answer
            })
    
    return {
        "title": data.get("title", "Untitled Puzzle"),
        "grid_size": grid_size,
        "difficulty": data.get("difficulty"),
        "description": data.get("notes"),
        "cells": cells,
        "clues": clues
    }

def export_to_nyt(puzzle_data: Dict[str, Any]) -> str:
    """Export puzzle data to NYT JSON format."""
    grid = []
    gridnums = []
    
    # Build grid and gridnums arrays
    for row in range(puzzle_data["grid_size"]):
        for col in range(puzzle_data["grid_size"]):
            cell = next((c for c in puzzle_data["cells"] 
                        if c["row"] == row and c["col"] == col), None)
            if cell:
                if cell["is_black_square"]:
                    grid.append(".")
                    gridnums.append(0)
                else:
                    grid.append(cell["solution"] or "")
                    gridnums.append(cell["number"] or 0)
    
    # Organize clues
    across_clues = []
    down_clues = []
    
    for clue in sorted(puzzle_data["clues"], key=lambda x: x["number"]):
        clue_text = f"{clue['number']}. {clue['text']}"
        if clue["direction"] == Direction.ACROSS:
            across_clues.append(clue_text)
        else:
            down_clues.append(clue_text)
    
    nyt_data = {
        "title": puzzle_data.get("title", "Untitled"),
        "author": puzzle_data.get("author", ""),
        "size": {
            "rows": puzzle_data["grid_size"],
            "cols": puzzle_data["grid_size"]
        },
        "grid": grid,
        "gridnums": gridnums,
        "clues": {
            "across": across_clues,
            "down": down_clues
        },
        "difficulty": puzzle_data.get("difficulty"),
        "notes": puzzle_data.get("description")
    }
    
    return json.dumps(nyt_data, indent=2)