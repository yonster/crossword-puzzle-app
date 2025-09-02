# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Requirements

A web application for creating, sharing, and playing crossword puzzles with the following features:
- Store user scores long-term in a database
- Track crossword squares, solutions, and clues in a database
- Support adjustable grid sizes from 5x5 to 25x25
- Import puzzles from .puz files
- Import/export New York Times puzzle submission format
- Use the same hotkey controls as The New York Times web app

## Technology Stack

### Backend
- **Framework**: FastAPI (Python) or Express.js (Node.js)
- **Database**: PostgreSQL for user data and puzzle storage
- **File Processing**: Python libraries for .puz file parsing (puzpy or similar)

### Frontend
- **Framework**: React with TypeScript
- **State Management**: Redux Toolkit or Zustand
- **Styling**: Tailwind CSS or styled-components
- **Grid Rendering**: CSS Grid or Canvas API for performance with large grids

## Project Structure

```
crossword/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── models/       # Database models
│   │   ├── services/     # Business logic
│   │   └── utils/        # File parsers, helpers
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── features/     # Feature modules
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API clients
│   │   └── utils/        # Helpers
│   ├── public/
│   └── package.json
└── database/
    └── migrations/       # Database migration files
```

## Development Commands

### Backend Setup (Python/FastAPI)
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Run development server
uvicorn app.main:app --reload --port 8000

# Run tests
pytest

# Database migrations
alembic upgrade head
alembic revision --autogenerate -m "description"
```

### Frontend Setup
```bash
# Install dependencies
cd frontend && npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Database Setup
```bash
# Create database
createdb crossword_db

# Run migrations
cd backend && alembic upgrade head
```

## Database Schema

### Core Tables
- **users**: id, username, email, created_at
- **puzzles**: id, title, author, grid_size, created_at, updated_at
- **puzzle_cells**: puzzle_id, row, col, solution, is_black_square
- **clues**: puzzle_id, number, direction (across/down), text
- **user_progress**: user_id, puzzle_id, current_state, completion_time, score

## Keyboard Controls (NYT-style)

- **Arrow Keys**: Navigate between cells
- **Tab/Shift+Tab**: Move to next/previous word
- **Space**: Switch between Across and Down
- **Backspace**: Clear current cell and move back
- **Delete**: Clear current cell
- **Enter**: Move to next clue
- **Escape**: Deselect current cell

## File Format Support

### .puz File Structure
- Binary format with header, solution, and clue sections
- Use existing libraries: puzpy (Python) or puz-js (JavaScript)

### NYT Submission Format
- JSON structure with metadata, grid, and clues
- Implement custom parser/exporter following NYT specifications

## Grid Size Constraints
- Minimum: 5x5
- Maximum: 25x25
- Validate on both frontend and backend
- Consider performance optimizations for larger grids (virtual scrolling, canvas rendering)

## API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/puzzles          # List puzzles
POST   /api/puzzles          # Create puzzle
GET    /api/puzzles/{id}     # Get puzzle
POST   /api/puzzles/import   # Import .puz or NYT format
GET    /api/puzzles/{id}/export/{format}
POST   /api/progress         # Save user progress
GET    /api/progress/{puzzle_id}
GET    /api/leaderboard/{puzzle_id}
```

## Testing Strategy

- Unit tests for file parsers and puzzle logic
- Integration tests for API endpoints
- Component tests for React components
- E2E tests for critical user flows (solving puzzle, saving progress)

## Performance Considerations

- Implement pagination for puzzle lists
- Use database indexing on frequently queried fields
- Consider caching for puzzle data
- Optimize grid rendering for large puzzles (25x25)
- Implement debouncing for auto-save functionality