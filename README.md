# Alex's Crossword Puzzles

A full-featured web application for creating, sharing, and playing crossword puzzles with support for various grid sizes and file formats.

## Features

### 🎮 Interactive Puzzle Solving
- **NYT-style keyboard controls** with intelligent navigation
- **Smart word completion** - automatically moves to next incomplete word
- **Double-click orientation toggle** - quickly switch between Across/Down
- **Word-based highlighting** - highlights entire words, not just rows/columns
- **Auto-scroll clue list** - keeps current clue visible

### ⏱️ Timer & Progress Tracking  
- **Built-in timer** with pause/resume and reset functionality
- **Auto-start timing** on first user interaction
- **Progress tracking** with completion percentage
- **Puzzle checking** with correct/incorrect feedback
- **Visual progress indicators** only shown after checking

### 🔧 Puzzle Management
- **Import/export puzzles** in .puz and NYT JSON formats
- **Support for grid sizes** from 5x5 to 25x25
- **User authentication** and progress saving
- **Puzzle creation** via file upload

### 🎯 Advanced Features
- **Crossing clue display** - see both primary and perpendicular clues
- **Reveal functionality** - reveal letters, words, or entire puzzle  
- **Clear puzzle** option to start over
- **Completion celebration** when puzzle is solved correctly

## Technology Stack

### Backend
- FastAPI (Python)
- SQLite database (SQLAlchemy ORM)
- JWT authentication
- Alembic database migrations

### Frontend
- React with TypeScript
- Redux Toolkit for state management
- Tailwind CSS for styling
- Vite for build tooling

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Initialize the database:
```bash
alembic upgrade head
```

5. Run the development server:
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at http://localhost:8000

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The application will be available at http://localhost:3000

## Keyboard Controls

- **Arrow Keys**: Navigate between cells
- **Tab/Enter**: Move to next incomplete word (smart navigation)
- **Shift+Tab**: Move to previous word
- **Space**: Switch between Across and Down directions
- **Backspace/Delete**: Clear current cell and move back (cross-word navigation)
- **Escape**: Deselect current cell
- **Double-click**: Toggle orientation (alternative to spacebar)

## Mouse Controls

- **Click**: Select a cell
- **Double-click**: Toggle between Across and Down directions

## API Documentation

Once the backend is running, you can access the interactive API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## File Format Support

### .puz Files
Standard binary crossword format used by many puzzle applications.

### NYT JSON Format
JSON format used for New York Times puzzle submissions, containing metadata, grid, and clues.

## Development

### Running Tests

Backend:
```bash
cd backend
pytest
```

Frontend:
```bash
cd frontend
npm test
```

### Building for Production

Frontend:
```bash
cd frontend
npm run build
```

## License

MIT