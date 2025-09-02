import struct
from typing import Dict, List, Any
from ..schemas.puzzle import Direction

def parse_puz_file(file_content: bytes) -> Dict[str, Any]:
    """Parse a .puz file and return puzzle data."""
    
    # .puz file format - read piece by piece
    if len(file_content) < 52:
        raise ValueError("Invalid .puz file: too small")
    
    # Read the basic header information
    # Offset 0x2C (44): width (1 byte)
    # Offset 0x2D (45): height (1 byte) 
    # Offset 0x2E (46): number of clues (2 bytes)
    
    width = file_content[44]
    height = file_content[45]
    num_clues = struct.unpack('<H', file_content[46:48])[0]
    
    if width == 0 or height == 0:
        raise ValueError("Invalid .puz file: invalid grid dimensions")
    
    # Current position in the file after header
    pos = 52
    
    # Read solution grid
    grid_size = width * height
    if pos + grid_size > len(file_content):
        raise ValueError("Invalid .puz file: incomplete solution grid")
    
    solution = file_content[pos:pos + grid_size].decode('latin-1')
    pos += grid_size
    
    # Read player grid (skip for import)
    pos += grid_size
    
    # Read strings (null-terminated)
    strings = []
    while pos < len(file_content):
        end = file_content.find(b'\x00', pos)
        if end == -1:
            strings.append(file_content[pos:].decode('latin-1', errors='ignore'))
            break
        strings.append(file_content[pos:end].decode('latin-1', errors='ignore'))
        pos = end + 1
    
    # Parse strings: title, author, copyright, then clues
    title = strings[0] if len(strings) > 0 else "Untitled"
    author = strings[1] if len(strings) > 1 else "Unknown"
    copyright_info = strings[2] if len(strings) > 2 else ""
    
    # Notes/description might be after clues
    clue_strings = strings[3:3 + num_clues] if len(strings) > 3 else []
    
    # Build grid and find numbered cells
    cells = []
    clues = []
    cell_numbers = {}
    current_number = 1
    
    # First pass: identify numbered cells
    for row in range(height):
        for col in range(width):
            idx = row * width + col
            cell_char = solution[idx]
            
            if cell_char == '.':
                # Black square
                cells.append({
                    "row": row,
                    "col": col,
                    "solution": None,
                    "number": None,
                    "is_black_square": True
                })
            else:
                # White square - check if it needs a number
                needs_number = False
                
                # Check if it starts an across word
                if (col == 0 or solution[(row * width) + col - 1] == '.') and \
                   col + 1 < width and solution[(row * width) + col + 1] != '.':
                    needs_number = True
                
                # Check if it starts a down word
                if (row == 0 or solution[((row - 1) * width) + col] == '.') and \
                   row + 1 < height and solution[((row + 1) * width) + col] != '.':
                    needs_number = True
                
                cell_number = current_number if needs_number else None
                if needs_number:
                    cell_numbers[(row, col)] = current_number
                    current_number += 1
                
                cells.append({
                    "row": row,
                    "col": col,
                    "solution": cell_char,
                    "number": cell_number,
                    "is_black_square": False
                })
    
    # Build clues by finding words and matching with clue strings
    across_clues = []
    down_clues = []
    
    # Find across words
    clue_index = 0
    for row in range(height):
        col = 0
        while col < width:
            if solution[row * width + col] != '.':
                # Found start of potential word
                word_start_col = col
                word = ""
                while col < width and solution[row * width + col] != '.':
                    word += solution[row * width + col]
                    col += 1
                
                # Only create clue if word is more than 1 letter
                if len(word) > 1:
                    cell_number = cell_numbers.get((row, word_start_col))
                    if cell_number and clue_index < len(clue_strings):
                        across_clues.append({
                            "number": cell_number,
                            "direction": Direction.ACROSS,
                            "text": clue_strings[clue_index],
                            "answer": word
                        })
                        clue_index += 1
            else:
                col += 1
    
    # Find down words
    for col in range(width):
        row = 0
        while row < height:
            if solution[row * width + col] != '.':
                # Found start of potential word
                word_start_row = row
                word = ""
                while row < height and solution[row * width + col] != '.':
                    word += solution[row * width + col]
                    row += 1
                
                # Only create clue if word is more than 1 letter
                if len(word) > 1:
                    cell_number = cell_numbers.get((word_start_row, col))
                    if cell_number and clue_index < len(clue_strings):
                        down_clues.append({
                            "number": cell_number,
                            "direction": Direction.DOWN,
                            "text": clue_strings[clue_index],
                            "answer": word
                        })
                        clue_index += 1
            else:
                row += 1
    
    # Combine clues
    clues = across_clues + down_clues
    
    return {
        "title": title,
        "grid_size": width,  # Assuming square grid
        "difficulty": None,
        "description": copyright_info,
        "cells": cells,
        "clues": clues
    }

def export_to_puz(puzzle_data: Dict[str, Any]) -> bytes:
    """Export puzzle data to .puz format."""
    # For now, return placeholder - implementing export is more complex
    raise NotImplementedError("PUZ file export not yet implemented.")