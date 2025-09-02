import { useSelector, useDispatch } from 'react-redux'
import { useEffect, useRef } from 'react'
import { RootState, AppDispatch } from '../store/store'
import { selectCell } from '../store/puzzleSlice'
import clsx from 'clsx'

export default function ClueList() {
  const dispatch = useDispatch<AppDispatch>()
  const { currentPuzzle, selectedCell, direction } = useSelector(
    (state: RootState) => state.puzzle
  )
  const selectedClueRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to selected clue
  useEffect(() => {
    if (selectedClueRef.current) {
      selectedClueRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      })
    }
  }, [selectedCell, direction])

  if (!currentPuzzle) return null

  const acrossClues = currentPuzzle.clues.filter(c => c.direction === 'ACROSS')
  const downClues = currentPuzzle.clues.filter(c => c.direction === 'DOWN')

  const getSelectedClueNumber = () => {
    if (!selectedCell) return null
    
    const cell = currentPuzzle.cells.find(
      c => c.row === selectedCell.row && c.col === selectedCell.col
    )
    
    if (!cell) return null

    // Find the starting cell of the word
    let startRow = selectedCell.row
    let startCol = selectedCell.col

    if (direction === 'ACROSS') {
      // Move left to find start
      while (startCol > 0) {
        const prevCell = currentPuzzle.cells.find(
          c => c.row === startRow && c.col === startCol - 1
        )
        if (!prevCell || prevCell.is_black_square) break
        startCol--
      }
    } else {
      // Move up to find start
      while (startRow > 0) {
        const prevCell = currentPuzzle.cells.find(
          c => c.row === startRow - 1 && c.col === startCol
        )
        if (!prevCell || prevCell.is_black_square) break
        startRow--
      }
    }

    const startCell = currentPuzzle.cells.find(
      c => c.row === startRow && c.col === startCol
    )
    
    return startCell?.number
  }

  const selectedClueNumber = getSelectedClueNumber()

  const handleClueClick = (clue: any) => {
    // Find the first cell of this clue
    const cell = currentPuzzle.cells.find(c => c.number === clue.number)
    if (cell) {
      dispatch(selectCell({ row: cell.row, col: cell.col }))
    }
  }

  return (
    <div className="flex gap-8">
      <div className="flex-1">
        <h3 className="font-bold text-lg mb-2">Across</h3>
        <div className="space-y-1">
          {acrossClues.map((clue) => {
            const isSelected = selectedClueNumber === clue.number && direction === 'ACROSS'
            return (
              <div
                key={`across-${clue.number}`}
                ref={isSelected ? selectedClueRef : null}
                onClick={() => handleClueClick(clue)}
                className={clsx(
                  'p-2 cursor-pointer rounded',
                  {
                    'bg-blue-100': isSelected,
                    'hover:bg-gray-100': !isSelected,
                  }
                )}
              >
                <span className="font-bold">{clue.number}.</span> {clue.text}
              </div>
            )
          })}
        </div>
      </div>
      
      <div className="flex-1">
        <h3 className="font-bold text-lg mb-2">Down</h3>
        <div className="space-y-1">
          {downClues.map((clue) => {
            const isSelected = selectedClueNumber === clue.number && direction === 'DOWN'
            return (
              <div
                key={`down-${clue.number}`}
                ref={isSelected ? selectedClueRef : null}
                onClick={() => handleClueClick(clue)}
                className={clsx(
                  'p-2 cursor-pointer rounded',
                  {
                    'bg-blue-100': isSelected,
                    'hover:bg-gray-100': !isSelected,
                  }
                )}
              >
                <span className="font-bold">{clue.number}.</span> {clue.text}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}