import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import { 
  checkPuzzle, 
  revealLetter, 
  revealWord, 
  revealPuzzle,
  clearPuzzle,
  getPuzzleProgress 
} from '../store/puzzleSlice'

export default function PuzzleControls() {
  const dispatch = useDispatch<AppDispatch>()
  const { currentPuzzle, selectedCell, userGrid, hasBeenChecked } = useSelector(
    (state: RootState) => state.puzzle
  )

  if (!currentPuzzle) return null

  const progress = getPuzzleProgress(currentPuzzle, userGrid)

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-bold text-lg mb-4">Puzzle Status</h3>
      
      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Progress</span>
          <span>{Math.round(progress.percentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${progress.percentage}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {progress.filled} of {progress.total} letters filled
        </p>
        {hasBeenChecked && progress.correct > 0 && (
          <p className="text-sm text-green-600">
            {progress.correct} letters correct
          </p>
        )}
        {hasBeenChecked && progress.incorrect > 0 && (
          <p className="text-sm text-red-600">
            {progress.incorrect} letters incorrect
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => dispatch(checkPuzzle())}
            className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Check Puzzle
          </button>
          <button
            onClick={() => dispatch(clearPuzzle())}
            className="px-3 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            Clear All
          </button>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => selectedCell && dispatch(revealLetter())}
            disabled={!selectedCell}
            className="px-3 py-2 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reveal Letter
          </button>
          <button
            onClick={() => selectedCell && dispatch(revealWord())}
            disabled={!selectedCell}
            className="px-3 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reveal Word
          </button>
        </div>
        
        <button
          onClick={() => dispatch(revealPuzzle())}
          className="w-full px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
        >
          Reveal Puzzle
        </button>
      </div>

      {progress.percentage === 100 && progress.incorrect === 0 && (
        <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
          <p className="text-green-800 font-bold text-center">
            🎉 Congratulations! Puzzle completed!
          </p>
        </div>
      )}
    </div>
  )
}