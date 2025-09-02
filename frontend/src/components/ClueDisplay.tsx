import { useSelector } from 'react-redux'
import { RootState } from '../store/store'

// Helper function to get all cells in the current word (same as in CrosswordGrid)
function getCurrentWordCells(selectedCell: {row: number, col: number}, direction: 'ACROSS' | 'DOWN', puzzle: any) {
  const wordCells: any[] = []
  
  if (direction === 'ACROSS') {
    // Find the start of the word by going left until black square or edge
    let startCol = selectedCell.col
    while (startCol > 0) {
      const prevCell = puzzle.cells.find((c: any) => c.row === selectedCell.row && c.col === startCol - 1)
      if (!prevCell || prevCell.is_black_square) break
      startCol--
    }
    
    // Collect all cells in the word going right
    let currentCol = startCol
    while (currentCol < puzzle.grid_size) {
      const cell = puzzle.cells.find((c: any) => c.row === selectedCell.row && c.col === currentCol)
      if (!cell || cell.is_black_square) break
      wordCells.push(cell)
      currentCol++
    }
  } else {
    // Find the start of the word by going up until black square or edge
    let startRow = selectedCell.row
    while (startRow > 0) {
      const prevCell = puzzle.cells.find((c: any) => c.row === startRow - 1 && c.col === selectedCell.col)
      if (!prevCell || prevCell.is_black_square) break
      startRow--
    }
    
    // Collect all cells in the word going down
    let currentRow = startRow
    while (currentRow < puzzle.grid_size) {
      const cell = puzzle.cells.find((c: any) => c.row === currentRow && c.col === selectedCell.col)
      if (!cell || cell.is_black_square) break
      wordCells.push(cell)
      currentRow++
    }
  }
  
  return wordCells
}

export default function ClueDisplay() {
  const { currentPuzzle, selectedCell, direction } = useSelector(
    (state: RootState) => state.puzzle
  )

  if (!currentPuzzle || !selectedCell) return null

  // Get primary clue (current direction)
  const primaryWordCells = getCurrentWordCells(selectedCell, direction, currentPuzzle)
  const primaryClue = currentPuzzle.clues.find(clue => {
    const clueStartCell = currentPuzzle.cells.find(c => c.number === clue.number)
    return clueStartCell && primaryWordCells.some(cell => 
      cell.row === clueStartCell.row && cell.col === clueStartCell.col
    ) && clue.direction === direction
  })

  // Get crossing clue (opposite direction)
  const crossingDirection = direction === 'ACROSS' ? 'DOWN' : 'ACROSS'
  const crossingWordCells = getCurrentWordCells(selectedCell, crossingDirection, currentPuzzle)
  const crossingClue = currentPuzzle.clues.find(clue => {
    const clueStartCell = currentPuzzle.cells.find(c => c.number === clue.number)
    return clueStartCell && crossingWordCells.some(cell => 
      cell.row === clueStartCell.row && cell.col === clueStartCell.col
    ) && clue.direction === crossingDirection
  })

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <h3 className="font-bold text-lg mb-3">Current Clues</h3>
      
      {/* Primary Clue */}
      {primaryClue && (
        <div className="mb-3">
          <div className="flex items-center mb-1">
            <span className="inline-block bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold mr-2">
              {direction}
            </span>
            <span className="font-bold text-gray-900">
              {primaryClue.number}.
            </span>
          </div>
          <p className="text-gray-800 leading-relaxed">
            {primaryClue.text}
          </p>
        </div>
      )}

      {/* Crossing Clue */}
      {crossingClue && crossingWordCells.length > 1 && (
        <div className="border-t pt-3">
          <div className="flex items-center mb-1">
            <span className="inline-block bg-gray-500 text-white px-2 py-1 rounded text-xs font-bold mr-2">
              {crossingDirection}
            </span>
            <span className="font-bold text-gray-700">
              {crossingClue.number}.
            </span>
          </div>
          <p className="text-gray-600 leading-relaxed">
            {crossingClue.text}
          </p>
        </div>
      )}
    </div>
  )
}