from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import auth, puzzles, progress
from .database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Crossword Puzzle API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(puzzles.router, prefix="/api/puzzles", tags=["puzzles"])
app.include_router(progress.router, prefix="/api/progress", tags=["progress"])

@app.get("/")
def read_root():
    return {"message": "Crossword Puzzle API", "version": "1.0.0"}