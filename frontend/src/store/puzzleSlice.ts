import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'
import { RootState } from './store'
import config from '../config'

export interface Cell {
  row: number
  col: number
  solution: string | null
  number: number | null
  is_black_square: boolean
  userEntry?: string
}

export interface Clue {
  number: number
  direction: 'ACROSS' | 'DOWN'
  text: string
  answer: string
}

export interface Puzzle {
  id: number
  title: string
  grid_size: number
  cells: Cell[]
  clues: Clue[]
}

interface PuzzleState {
  currentPuzzle: Puzzle | null
  puzzles: Puzzle[]
  userGrid: { [key: string]: string }
  selectedCell: { row: number; col: number } | null
  direction: 'ACROSS' | 'DOWN'
  checkedCells: { [key: string]: 'correct' | 'incorrect' }
  hasBeenChecked: boolean
  startTime: number | null
  elapsedTime: number
  isTimerRunning: boolean
  lastTimerUpdate: number
  isCompleted: boolean
  isLoading: boolean
  error: string | null
}

const initialState: PuzzleState = {
  currentPuzzle: null,
  puzzles: [],
  userGrid: {},
  selectedCell: null,
  direction: 'ACROSS',
  checkedCells: {},
  hasBeenChecked: false,
  startTime: null,
  elapsedTime: 0,
  isTimerRunning: false,
  lastTimerUpdate: 0,
  isCompleted: false,
  isLoading: false,
  error: null,
}

export const fetchPuzzles = createAsyncThunk(
  'puzzle/fetchPuzzles',
  async () => {
    const response = await axios.get(`${config.apiUrl}/api/puzzles`)
    return response.data
  }
)

export const fetchPuzzle = createAsyncThunk(
  'puzzle/fetchPuzzle',
  async (id: number, { getState }) => {
    const state = getState() as RootState
    const token = state.auth.token
    
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const response = await axios.get(`${config.apiUrl}/api/puzzles/${id}`, { headers })
    return response.data
  }
)

export const fetchProgress = createAsyncThunk(
  'puzzle/fetchProgress',
  async (puzzleId: number, { getState }) => {
    const state = getState() as RootState
    const token = state.auth.token
    
    if (!token) return null
    
    try {
      const response = await axios.get(`${config.apiUrl}/api/progress/${puzzleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null // No progress found, that's ok
      }
      throw error
    }
  }
)

export const saveProgress = createAsyncThunk(
  'puzzle/saveProgress',
  async ({ puzzleId, state }: { puzzleId: number; state: any }, { getState }) => {
    const rootState = getState() as RootState
    const token = rootState.auth.token
    
    // Calculate total elapsed time including current running session
    const { elapsedTime, isTimerRunning, startTime } = rootState.puzzle
    const totalElapsedTime = isTimerRunning && startTime 
      ? elapsedTime + (Date.now() - startTime)
      : elapsedTime
    
    const response = await axios.post(
      `${config.apiUrl}/api/progress/`,
      {
        puzzle_id: puzzleId,
        current_state: state,
        completion_percentage: calculateCompletionPercentage(rootState.puzzle),
        completion_time: Math.floor(totalElapsedTime / 1000),
      },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return response.data
  }
)

export const deletePuzzle = createAsyncThunk(
  'puzzle/deletePuzzle',
  async (puzzleId: number, { getState }) => {
    const state = getState() as RootState
    const token = state.auth.token
    
    if (!token) {
      throw new Error('Authentication required to delete puzzle')
    }
    
    const response = await axios.delete(`${config.apiUrl}/api/puzzles/${puzzleId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return { puzzleId, message: response.data.message }
  }
)

function calculateCompletionPercentage(puzzleState: PuzzleState): number {
  if (!puzzleState.currentPuzzle) return 0
  
  const totalCells = puzzleState.currentPuzzle.cells.filter(c => !c.is_black_square).length
  const filledCells = Object.keys(puzzleState.userGrid).filter(key => puzzleState.userGrid[key]).length
  
  return (filledCells / totalCells) * 100
}

const puzzleSlice = createSlice({
  name: 'puzzle',
  initialState,
  reducers: {
    selectCell: (state, action: PayloadAction<{ row: number; col: number }>) => {
      state.selectedCell = action.payload
    },
    enterLetter: (state, action: PayloadAction<string>) => {
      if (!state.selectedCell || state.isCompleted) return
      
      const key = `${state.selectedCell.row},${state.selectedCell.col}`
      state.userGrid[key] = action.payload.toUpperCase()
      
      // Check if puzzle is now completely filled and correct
      const isPuzzleComplete = checkPuzzleCompletion(state)
      if (isPuzzleComplete) {
        state.isCompleted = true
        state.isTimerRunning = false
      }
      
      // Check if current word is complete
      if (state.currentPuzzle) {
        const currentWordCells = getCurrentWordCells(state.selectedCell, state.direction, state.currentPuzzle)
        const isWordComplete = currentWordCells.every(cell => {
          const cellKey = `${cell.row},${cell.col}`
          return state.userGrid[cellKey]
        })
        
        if (isWordComplete) {
          // Move to next word with empty cells in same direction
          const nextWordCell = getNextWordWithEmptyCell(state)
          if (nextWordCell) {
            state.selectedCell = nextWordCell
          }
        } else {
          // Move to next empty cell in current word
          const nextEmptyInWord = currentWordCells.find(cell => {
            const cellKey = `${cell.row},${cell.col}`
            return !state.userGrid[cellKey] && 
              !(cell.row === state.selectedCell!.row && cell.col === state.selectedCell!.col)
          })
          
          if (nextEmptyInWord) {
            state.selectedCell = { row: nextEmptyInWord.row, col: nextEmptyInWord.col }
          } else {
            // Move to next cell in direction
            const nextCell = getNextCell(state)
            if (nextCell) {
              state.selectedCell = nextCell
            }
          }
        }
      }
    },
    deleteLetter: (state) => {
      if (!state.selectedCell) return
      
      const key = `${state.selectedCell.row},${state.selectedCell.col}`
      state.userGrid[key] = ''
    },
    deleteLetterAndMove: (state) => {
      if (!state.selectedCell || !state.currentPuzzle) return
      
      const key = `${state.selectedCell.row},${state.selectedCell.col}`
      const currentEntry = state.userGrid[key]
      
      // Clear current cell
      state.userGrid[key] = ''
      
      // Only move if the cell was already empty
      if (!currentEntry) {
        // Find previous cell in current direction
        const prevCell = getPreviousCell(state)
        if (prevCell) {
          state.selectedCell = prevCell
        }
      }
    },
    moveCursor: (state, action: PayloadAction<'up' | 'down' | 'left' | 'right'>) => {
      if (!state.selectedCell || !state.currentPuzzle) return
      
      const { row, col } = state.selectedCell
      let newRow = row
      let newCol = col
      
      switch (action.payload) {
        case 'up':
          newRow = Math.max(0, row - 1)
          break
        case 'down':
          newRow = Math.min(state.currentPuzzle.grid_size - 1, row + 1)
          break
        case 'left':
          newCol = Math.max(0, col - 1)
          break
        case 'right':
          newCol = Math.min(state.currentPuzzle.grid_size - 1, col + 1)
          break
      }
      
      const cell = state.currentPuzzle.cells.find(c => c.row === newRow && c.col === newCol)
      if (cell && !cell.is_black_square) {
        state.selectedCell = { row: newRow, col: newCol }
      }
    },
    toggleDirection: (state) => {
      state.direction = state.direction === 'ACROSS' ? 'DOWN' : 'ACROSS'
    },
    loadProgress: (state, action: PayloadAction<{ [key: string]: string }>) => {
      state.userGrid = action.payload
    },
    moveToNextWord: (state) => {
      if (!state.selectedCell || !state.currentPuzzle) return
      
      // Find next word starting position
      const currentClues = state.currentPuzzle.clues
        .filter(c => c.direction === state.direction)
        .sort((a, b) => a.number - b.number)
      
      // Find current clue
      const currentWordCells = getCurrentWordCells(state.selectedCell, state.direction, state.currentPuzzle)
      const currentClue = currentClues.find(clue => {
        const clueStartCell = state.currentPuzzle!.cells.find(c => c.number === clue.number)
        return clueStartCell && currentWordCells.some(cell => 
          cell.row === clueStartCell.row && cell.col === clueStartCell.col
        )
      })
      
      if (currentClue) {
        const currentIndex = currentClues.findIndex(c => c.number === currentClue.number)
        const nextClue = currentClues[currentIndex + 1]
        
        if (nextClue) {
          const nextStartCell = state.currentPuzzle.cells.find(c => c.number === nextClue.number)
          if (nextStartCell) {
            state.selectedCell = { row: nextStartCell.row, col: nextStartCell.col }
          }
        }
      }
    },
    moveToNextEmptyCell: (state) => {
      if (!state.selectedCell || !state.currentPuzzle) return
      
      const currentWordCells = getCurrentWordCells(state.selectedCell, state.direction, state.currentPuzzle)
      const currentIndex = currentWordCells.findIndex(cell => 
        cell.row === state.selectedCell!.row && cell.col === state.selectedCell!.col
      )
      
      // Look for next empty cell in current word
      for (let i = currentIndex + 1; i < currentWordCells.length; i++) {
        const cell = currentWordCells[i]
        const key = `${cell.row},${cell.col}`
        if (!state.userGrid[key]) {
          state.selectedCell = { row: cell.row, col: cell.col }
          return
        }
      }
      
      // If no empty cells in current word, move to next word
      const nextCell = getNextCell(state)
      if (nextCell) {
        state.selectedCell = nextCell
      }
    },
    moveToNextEmptyWord: (state) => {
      if (!state.selectedCell || !state.currentPuzzle) return
      
      // Use the same logic as word completion - find next word with empty cells
      const nextWordCell = getNextWordWithEmptyCell(state)
      if (nextWordCell) {
        state.selectedCell = nextWordCell
      }
    },
    moveToPreviousEmptyWord: (state) => {
      if (!state.selectedCell || !state.currentPuzzle) return
      
      // Find previous word with empty cells
      const prevWordCell = getPreviousWordWithEmptyCell(state)
      if (prevWordCell) {
        state.selectedCell = prevWordCell
      }
    },
    checkPuzzle: (state) => {
      if (!state.currentPuzzle) return
      
      // Check all filled cells
      state.checkedCells = {}
      state.hasBeenChecked = true
      Object.entries(state.userGrid).forEach(([key, userLetter]) => {
        if (userLetter) {
          const [row, col] = key.split(',').map(Number)
          const cell = state.currentPuzzle!.cells.find(c => c.row === row && c.col === col)
          if (cell && cell.solution) {
            state.checkedCells[key] = userLetter.toUpperCase() === cell.solution.toUpperCase() 
              ? 'correct' : 'incorrect'
          }
        }
      })
    },
    revealLetter: (state) => {
      if (!state.selectedCell || !state.currentPuzzle) return
      
      const key = `${state.selectedCell.row},${state.selectedCell.col}`
      const cell = state.currentPuzzle.cells.find(
        c => c.row === state.selectedCell!.row && c.col === state.selectedCell!.col
      )
      
      if (cell && cell.solution && !cell.is_black_square) {
        state.userGrid[key] = cell.solution
        state.checkedCells[key] = 'correct'
      }
    },
    revealWord: (state) => {
      if (!state.selectedCell || !state.currentPuzzle) return
      
      const wordCells = getCurrentWordCells(state.selectedCell, state.direction, state.currentPuzzle)
      wordCells.forEach(cell => {
        if (cell.solution && !cell.is_black_square) {
          const key = `${cell.row},${cell.col}`
          state.userGrid[key] = cell.solution
          state.checkedCells[key] = 'correct'
        }
      })
    },
    revealPuzzle: (state) => {
      if (!state.currentPuzzle) return
      
      state.currentPuzzle.cells.forEach(cell => {
        if (cell.solution && !cell.is_black_square) {
          const key = `${cell.row},${cell.col}`
          state.userGrid[key] = cell.solution
          state.checkedCells[key] = 'correct'
        }
      })
    },
    clearPuzzle: (state) => {
      state.userGrid = {}
      state.checkedCells = {}
      state.hasBeenChecked = false
    },
    startTimer: (state) => {
      if (!state.isTimerRunning) {
        state.startTime = Date.now()
        state.isTimerRunning = true
      }
    },
    stopTimer: (state) => {
      if (state.isTimerRunning && state.startTime) {
        state.elapsedTime += Date.now() - state.startTime
        state.isTimerRunning = false
        state.startTime = null
      }
    },
    updateTimer: (state) => {
      // Update timestamp to force re-render
      state.lastTimerUpdate = Date.now()
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPuzzles.fulfilled, (state, action) => {
        state.puzzles = action.payload
      })
      .addCase(fetchPuzzle.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchPuzzle.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentPuzzle = action.payload
        state.hasBeenChecked = false
        state.checkedCells = {}
        
        // Reset timer and completion status for new puzzle (will be overridden by fetchProgress if saved)
        state.startTime = null
        state.elapsedTime = 0
        state.isTimerRunning = false
        state.lastTimerUpdate = 0
        state.isCompleted = false
        
        // Load user progress if available
        if (action.payload.user_progress?.current_state) {
          state.userGrid = action.payload.user_progress.current_state
        } else {
          state.userGrid = {}
        }
        
        // Set default starting position to first blank square with across orientation
        if (action.payload.cells && action.payload.cells.length > 0) {
          const firstBlankCell = action.payload.cells.find(cell => 
            !cell.is_black_square && cell.number
          )
          if (firstBlankCell) {
            state.selectedCell = { row: firstBlankCell.row, col: firstBlankCell.col }
            state.direction = 'ACROSS'
          }
        }
      })
      .addCase(fetchProgress.fulfilled, (state, action) => {
        if (action.payload) {
          // Load saved grid state
          if (action.payload.current_state) {
            try {
              state.userGrid = JSON.parse(action.payload.current_state)
            } catch (e) {
              console.error('Failed to parse saved grid state:', e)
            }
          }
          
          // Load saved timer value (convert seconds to milliseconds)
          if (action.payload.completion_time) {
            state.elapsedTime = action.payload.completion_time * 1000
          }
          
          // If the puzzle is completed, lock it
          if (action.payload.is_completed) {
            state.isCompleted = true
            state.isTimerRunning = false
          }
        }
      })
      .addCase(fetchPuzzle.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to load puzzle'
      })
      .addCase(deletePuzzle.fulfilled, (state, action) => {
        // Remove the deleted puzzle from the puzzles list
        state.puzzles = state.puzzles.filter(puzzle => puzzle.id !== action.payload.puzzleId)
      })
      .addCase(deletePuzzle.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete puzzle'
      })
  },
})

function getCurrentWordCells(selectedCell: {row: number, col: number}, direction: 'ACROSS' | 'DOWN', puzzle: Puzzle): Cell[] {
  const wordCells: Cell[] = []
  
  if (direction === 'ACROSS') {
    // Find the start of the word by going left until black square or edge
    let startCol = selectedCell.col
    while (startCol > 0) {
      const prevCell = puzzle.cells.find(c => c.row === selectedCell.row && c.col === startCol - 1)
      if (!prevCell || prevCell.is_black_square) break
      startCol--
    }
    
    // Collect all cells in the word going right
    let currentCol = startCol
    while (currentCol < puzzle.grid_size) {
      const cell = puzzle.cells.find(c => c.row === selectedCell.row && c.col === currentCol)
      if (!cell || cell.is_black_square) break
      wordCells.push(cell)
      currentCol++
    }
  } else {
    // Find the start of the word by going up until black square or edge
    let startRow = selectedCell.row
    while (startRow > 0) {
      const prevCell = puzzle.cells.find(c => c.row === startRow - 1 && c.col === selectedCell.col)
      if (!prevCell || prevCell.is_black_square) break
      startRow--
    }
    
    // Collect all cells in the word going down
    let currentRow = startRow
    while (currentRow < puzzle.grid_size) {
      const cell = puzzle.cells.find(c => c.row === currentRow && c.col === selectedCell.col)
      if (!cell || cell.is_black_square) break
      wordCells.push(cell)
      currentRow++
    }
  }
  
  return wordCells
}

function getNextEmptyCell(state: PuzzleState): { row: number; col: number } | null {
  if (!state.selectedCell || !state.currentPuzzle) return null
  
  // Find next word with empty cells
  const currentClues = state.currentPuzzle.clues
    .filter(c => c.direction === state.direction)
    .sort((a, b) => a.number - b.number)
  
  for (const clue of currentClues) {
    const startCell = state.currentPuzzle.cells.find(c => c.number === clue.number)
    if (!startCell) continue
    
    const wordCells = getCurrentWordCells(startCell, state.direction, state.currentPuzzle)
    const emptyCell = wordCells.find(cell => {
      const key = `${cell.row},${cell.col}`
      return !state.userGrid[key]
    })
    
    if (emptyCell) {
      return { row: emptyCell.row, col: emptyCell.col }
    }
  }
  
  return null
}

function getNextWordWithEmptyCell(state: PuzzleState): { row: number; col: number } | null {
  if (!state.selectedCell || !state.currentPuzzle) return null
  
  // Get current word to find where we are
  const currentWordCells = getCurrentWordCells(state.selectedCell, state.direction, state.currentPuzzle)
  const currentClue = state.currentPuzzle.clues.find(clue => {
    const clueStartCell = state.currentPuzzle!.cells.find(c => c.number === clue.number)
    return clueStartCell && currentWordCells.some(cell => 
      cell.row === clueStartCell.row && cell.col === clueStartCell.col
    ) && clue.direction === state.direction
  })
  
  if (!currentClue) return null
  
  // Get all clues of same direction, sorted by number
  const currentClues = state.currentPuzzle.clues
    .filter(c => c.direction === state.direction)
    .sort((a, b) => a.number - b.number)
  
  // Find current clue index
  const currentIndex = currentClues.findIndex(c => c.number === currentClue.number)
  
  // Look for next word with empty cells, starting from the next clue
  for (let i = currentIndex + 1; i < currentClues.length; i++) {
    const nextClue = currentClues[i]
    const startCell = state.currentPuzzle.cells.find(c => c.number === nextClue.number)
    if (!startCell) continue
    
    const wordCells = getCurrentWordCells(startCell, state.direction, state.currentPuzzle)
    const firstEmptyCell = wordCells.find(cell => {
      const key = `${cell.row},${cell.col}`
      return !state.userGrid[key]
    })
    
    if (firstEmptyCell) {
      return { row: firstEmptyCell.row, col: firstEmptyCell.col }
    }
  }
  
  // If no word found after current, wrap around and check from beginning
  for (let i = 0; i < currentIndex; i++) {
    const nextClue = currentClues[i]
    const startCell = state.currentPuzzle.cells.find(c => c.number === nextClue.number)
    if (!startCell) continue
    
    const wordCells = getCurrentWordCells(startCell, state.direction, state.currentPuzzle)
    const firstEmptyCell = wordCells.find(cell => {
      const key = `${cell.row},${cell.col}`
      return !state.userGrid[key]
    })
    
    if (firstEmptyCell) {
      return { row: firstEmptyCell.row, col: firstEmptyCell.col }
    }
  }
  
  return null
}

function getPreviousWordWithEmptyCell(state: PuzzleState): { row: number; col: number } | null {
  if (!state.selectedCell || !state.currentPuzzle) return null
  
  // Get current word to find where we are
  const currentWordCells = getCurrentWordCells(state.selectedCell, state.direction, state.currentPuzzle)
  const currentClue = state.currentPuzzle.clues.find(clue => {
    const clueStartCell = state.currentPuzzle!.cells.find(c => c.number === clue.number)
    return clueStartCell && currentWordCells.some(cell => 
      cell.row === clueStartCell.row && cell.col === clueStartCell.col
    ) && clue.direction === state.direction
  })
  
  if (!currentClue) return null
  
  // Get all clues of same direction, sorted by number
  const currentClues = state.currentPuzzle.clues
    .filter(c => c.direction === state.direction)
    .sort((a, b) => a.number - b.number)
  
  // Find current clue index
  const currentIndex = currentClues.findIndex(c => c.number === currentClue.number)
  
  // Look for previous word with empty cells, starting from the previous clue
  for (let i = currentIndex - 1; i >= 0; i--) {
    const prevClue = currentClues[i]
    const startCell = state.currentPuzzle.cells.find(c => c.number === prevClue.number)
    if (!startCell) continue
    
    const wordCells = getCurrentWordCells(startCell, state.direction, state.currentPuzzle)
    const firstEmptyCell = wordCells.find(cell => {
      const key = `${cell.row},${cell.col}`
      return !state.userGrid[key]
    })
    
    if (firstEmptyCell) {
      return { row: firstEmptyCell.row, col: firstEmptyCell.col }
    }
  }
  
  // If no word found before current, wrap around and check from end
  for (let i = currentClues.length - 1; i > currentIndex; i--) {
    const prevClue = currentClues[i]
    const startCell = state.currentPuzzle.cells.find(c => c.number === prevClue.number)
    if (!startCell) continue
    
    const wordCells = getCurrentWordCells(startCell, state.direction, state.currentPuzzle)
    const firstEmptyCell = wordCells.find(cell => {
      const key = `${cell.row},${cell.col}`
      return !state.userGrid[key]
    })
    
    if (firstEmptyCell) {
      return { row: firstEmptyCell.row, col: firstEmptyCell.col }
    }
  }
  
  return null
}

function getNextCell(state: PuzzleState): { row: number; col: number } | null {
  if (!state.selectedCell || !state.currentPuzzle) return null
  
  const { row, col } = state.selectedCell
  let nextRow = row
  let nextCol = col
  
  if (state.direction === 'ACROSS') {
    nextCol = col + 1
    if (nextCol >= state.currentPuzzle.grid_size) {
      return null
    }
  } else {
    nextRow = row + 1
    if (nextRow >= state.currentPuzzle.grid_size) {
      return null
    }
  }
  
  const cell = state.currentPuzzle.cells.find(c => c.row === nextRow && c.col === nextCol)
  if (cell && !cell.is_black_square) {
    return { row: nextRow, col: nextCol }
  }
  
  return null
}

function getPreviousCell(state: PuzzleState): { row: number; col: number } | null {
  if (!state.selectedCell || !state.currentPuzzle) return null
  
  const { row, col } = state.selectedCell
  
  // First try to find previous cell in current word
  const currentWordCells = getCurrentWordCells(state.selectedCell, state.direction, state.currentPuzzle)
  const currentIndex = currentWordCells.findIndex(cell => 
    cell.row === row && cell.col === col
  )
  
  if (currentIndex > 0) {
    const prevCell = currentWordCells[currentIndex - 1]
    return { row: prevCell.row, col: prevCell.col }
  }
  
  // If at start of word, find previous word with letters
  const allClues = state.currentPuzzle.clues
    .filter(c => c.direction === state.direction)
    .sort((a, b) => b.number - a.number) // Reverse order
  
  const currentClue = allClues.find(clue => {
    const clueStartCell = state.currentPuzzle!.cells.find(c => c.number === clue.number)
    return clueStartCell && currentWordCells.some(cell => 
      cell.row === clueStartCell.row && cell.col === clueStartCell.col
    )
  })
  
  if (!currentClue) return null
  
  const currentClueIndex = allClues.findIndex(c => c.number === currentClue.number)
  
  // Look for previous word with letters, starting from the previous clue
  for (let i = currentClueIndex + 1; i < allClues.length; i++) {
    const prevClue = allClues[i]
    const startCell = state.currentPuzzle.cells.find(c => c.number === prevClue.number)
    if (!startCell) continue
    
    const wordCells = getCurrentWordCells(startCell, state.direction, state.currentPuzzle)
    // Find the last filled cell in this word
    for (let j = wordCells.length - 1; j >= 0; j--) {
      const cell = wordCells[j]
      const key = `${cell.row},${cell.col}`
      if (state.userGrid[key]) {
        return { row: cell.row, col: cell.col }
      }
    }
    // If no filled cells, go to last cell of word
    const lastCell = wordCells[wordCells.length - 1]
    if (lastCell) {
      return { row: lastCell.row, col: lastCell.col }
    }
  }
  
  return null
}

// Utility function to get puzzle progress
export function getPuzzleProgress(puzzle: Puzzle, userGrid: { [key: string]: string }): {
  percentage: number
  filled: number
  total: number
  correct: number
  incorrect: number
} {
  const solvableCells = puzzle.cells.filter(c => !c.is_black_square)
  const total = solvableCells.length
  
  let filled = 0
  let correct = 0
  let incorrect = 0
  
  solvableCells.forEach(cell => {
    const key = `${cell.row},${cell.col}`
    const userEntry = userGrid[key]
    
    if (userEntry) {
      filled++
      if (cell.solution && userEntry.toUpperCase() === cell.solution.toUpperCase()) {
        correct++
      } else if (cell.solution) {
        incorrect++
      }
    }
  })
  
  return {
    percentage: total > 0 ? (filled / total) * 100 : 0,
    filled,
    total,
    correct,
    incorrect
  }
}

function checkPuzzleCompletion(state: PuzzleState): boolean {
  if (!state.currentPuzzle) return false
  
  const progress = getPuzzleProgress(state.currentPuzzle, state.userGrid)
  
  // Puzzle is complete when all cells are filled correctly
  return progress.filled === progress.total && progress.incorrect === 0
}

export const {
  selectCell,
  enterLetter,
  deleteLetter,
  deleteLetterAndMove,
  moveCursor,
  toggleDirection,
  loadProgress,
  moveToNextWord,
  moveToNextEmptyCell,
  moveToNextEmptyWord,
  moveToPreviousEmptyWord,
  checkPuzzle,
  revealLetter,
  revealWord,
  revealPuzzle,
  clearPuzzle,
  startTimer,
  stopTimer,
  updateTimer,
} = puzzleSlice.actions

export default puzzleSlice.reducer