import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import {
  selectCell,
  enterLetter,
  deleteLetter,
  deleteLetterAndMove,
  moveCursor,
  toggleDirection,
  moveToNextWord,
  moveToNextEmptyCell,
  moveToNextEmptyWord,
  moveToPreviousEmptyWord,
} from '../store/puzzleSlice'
import { Puzzle, Cell } from '../store/puzzleSlice'
import clsx from 'clsx'

// Helper function to get all cells in the current word
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

export default function CrosswordGrid() {
  const dispatch = useDispatch<AppDispatch>()
  const { currentPuzzle, userGrid, selectedCell, direction, checkedCells, isCompleted } = useSelector(
    (state: RootState) => state.puzzle
  )
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell || isCompleted) return

      // Letter input
      if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
        e.preventDefault()
        dispatch(enterLetter(e.key))
        return
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          dispatch(moveCursor('up'))
          break
        case 'ArrowDown':
          e.preventDefault()
          dispatch(moveCursor('down'))
          break
        case 'ArrowLeft':
          e.preventDefault()
          dispatch(moveCursor('left'))
          break
        case 'ArrowRight':
          e.preventDefault()
          dispatch(moveCursor('right'))
          break
        case 'Backspace':
        case 'Delete':
          e.preventDefault()
          dispatch(deleteLetterAndMove())
          break
        case ' ':
          e.preventDefault()
          dispatch(toggleDirection())
          break
        case 'Tab':
          e.preventDefault()
          if (e.shiftKey) {
            dispatch(moveToPreviousEmptyWord())
          } else {
            dispatch(moveToNextEmptyWord())
          }
          break
        case 'Enter':
          e.preventDefault()
          dispatch(moveToNextEmptyWord())
          break
        case 'Escape':
          e.preventDefault()
          dispatch(selectCell({ row: -1, col: -1 }))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedCell, direction, dispatch])

  if (!currentPuzzle) {
    return <div>Loading puzzle...</div>
  }

  const gridSize = currentPuzzle.grid_size
  const cellSize = Math.min(600 / gridSize, 40)

  return (
    <div
      ref={gridRef}
      data-puzzle-grid
      className="inline-block border-2 border-black"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
      }}
    >
      {currentPuzzle.cells.map((cell) => {
        const key = `${cell.row},${cell.col}`
        const isSelected =
          selectedCell?.row === cell.row && selectedCell?.col === cell.col
        const userEntry = userGrid[key] || ''
        const checkState = checkedCells[key]

        // Check if cell is part of selected word
        let isInSelectedWord = false
        if (selectedCell && !cell.is_black_square && currentPuzzle) {
          const wordCells = getCurrentWordCells(selectedCell, direction, currentPuzzle)
          isInSelectedWord = wordCells.some(wordCell => 
            wordCell.row === cell.row && wordCell.col === cell.col
          )
        }

        return (
          <div
            key={key}
            onClick={() => {
              if (!cell.is_black_square && !isCompleted) {
                dispatch(selectCell({ row: cell.row, col: cell.col }))
              }
            }}
            onDoubleClick={() => {
              if (!cell.is_black_square && !isCompleted) {
                dispatch(toggleDirection())
              }
            }}
            className={clsx(
              'border border-gray-300 relative flex items-center justify-center',
              {
                'bg-black': cell.is_black_square,
                'bg-blue-500 text-white': isSelected && !isCompleted,
                'bg-blue-100': isInSelectedWord && !isSelected && !isCompleted,
                'bg-green-200 border-green-400': checkState === 'correct',
                'bg-red-200 border-red-400': checkState === 'incorrect',
                'bg-green-100 border-green-300': isCompleted && !cell.is_black_square,
                'cursor-pointer': !isCompleted,
                'cursor-default': isCompleted,
                'hover:bg-gray-100': !cell.is_black_square && !isSelected && !isInSelectedWord && !checkState && !isCompleted,
              }
            )}
            style={{
              width: cellSize,
              height: cellSize,
            }}
          >
            {!cell.is_black_square && (
              <>
                {cell.number && (
                  <span className="absolute top-0 left-0.5 text-[8px] font-bold">
                    {cell.number}
                  </span>
                )}
                <span className="text-[22px] font-bold uppercase">
                  {userEntry}
                </span>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}