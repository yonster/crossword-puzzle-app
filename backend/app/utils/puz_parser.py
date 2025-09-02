import struct
from typing import Dict, List, Any
from ..schemas.puzzle import Direction

def decode_puz_string(raw_bytes: bytes) -> str:
    """
    Decode a string from .puz file with smart encoding detection.
    .puz files can use various encodings depending on their origin.
    """
    if not raw_bytes:
        return ""
    
    # First, try to detect UTF-8 more intelligently
    # UTF-8 has specific byte patterns we can detect
    try:
        decoded = raw_bytes.decode('utf-8')
        # Check if this looks like it contains UTF-8 smart quotes or other special chars
        utf8_indicators = [
            '\u201c', '\u201d',  # Left and right double quotes
            '\u2018', '\u2019',  # Left and right single quotes  
            '\u2013', '\u2014',  # En dash, em dash
            '\u2026',            # Ellipsis
        ]
        if any(char in decoded for char in utf8_indicators):
            return decoded
        # Also check if it's valid UTF-8 with reasonable content
        if decoded.isprintable() or all(ord(c) < 256 for c in decoded):
            return decoded
    except UnicodeDecodeError:
        pass
    
    # Then try Windows-1252, which is common for .puz files
    try:
        decoded = raw_bytes.decode('cp1252')
        # cp1252 should not produce replacement characters for most .puz content
        if '\ufffd' not in decoded:
            return decoded
    except (UnicodeDecodeError, LookupError):
        pass
    
    # Try other common encodings
    for encoding in ['latin-1', 'cp437']:
        try:
            decoded = raw_bytes.decode(encoding)
            if '\ufffd' not in decoded:
                return decoded
        except (UnicodeDecodeError, LookupError):
            continue
    
    # If all else fails, use latin-1 with error handling
    # This should always work since latin-1 can decode any byte
    return raw_bytes.decode('latin-1', errors='replace')

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
    
    solution = decode_puz_string(file_content[pos:pos + grid_size])
    pos += grid_size
    
    # Read player grid (skip for import)
    pos += grid_size
    
    # Read strings (null-terminated) with improved character encoding
    strings = []
    while pos < len(file_content):
        end = file_content.find(b'\x00', pos)
        if end == -1:
            raw_string = file_content[pos:]
            strings.append(decode_puz_string(raw_string))
            break
        raw_string = file_content[pos:end]
        strings.append(decode_puz_string(raw_string))
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
                
                # Check if it starts an across word (2+ letters)
                if (col == 0 or solution[(row * width) + col - 1] == '.') and \
                   col + 1 < width and solution[(row * width) + col + 1] != '.':
                    needs_number = True
                
                # Check if it starts a down word (2+ letters)
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
    # .puz format stores clues in a specific order: all across clues first (by number), then all down clues (by number)
    
    # First, find all words and their positions
    word_info = []  # List of (number, direction, answer)
    
    # Find across words
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
                    if cell_number:
                        word_info.append((cell_number, Direction.ACROSS, word))
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
                    if cell_number:
                        word_info.append((cell_number, Direction.DOWN, word))
            else:
                row += 1
    
    # .puz format orders clues numerically, with Across before Down when numbers are the same
    # This is the key insight from the .puz format specification
    
    # Create a combined list and sort by number, then by direction (Across before Down)
    all_words = [(num, dir, ans) for num, dir, ans in word_info]
    # Sort by number first, then by direction (ACROSS comes before DOWN when numbers match)
    all_words.sort(key=lambda x: (x[0], x[1] == Direction.DOWN))
    
    # Build clues by matching with clue strings in the correct .puz order
    clues = []
    clue_index = 0
    
    for number, direction, answer in all_words:
        if clue_index < len(clue_strings):
            clues.append({
                "number": number,
                "direction": direction,
                "text": clue_strings[clue_index],
                "answer": answer
            })
            clue_index += 1
    
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