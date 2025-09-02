import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import { startTimer } from '../store/puzzleSlice'

export default function StartPuzzleOverlay() {
  const dispatch = useDispatch<AppDispatch>()
  const { currentPuzzle, elapsedTime, isTimerRunning } = useSelector(
    (state: RootState) => state.puzzle
  )

  // Only show overlay if puzzle is loaded, timer hasn't started, and no elapsed time
  if (!currentPuzzle || isTimerRunning || elapsedTime > 0) {
    return null
  }

  const handleStartPuzzle = () => {
    dispatch(startTimer())
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full mx-4">
        <div className="text-center">
          <div className="text-4xl mb-4">🧩</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Ready to Start?
          </h2>
          <h3 className="text-lg font-medium text-gray-700 mb-4">
            {currentPuzzle.title}
          </h3>
          
          <div className="text-gray-600 mb-6 space-y-2">
            <p>Grid Size: {currentPuzzle.grid_size}×{currentPuzzle.grid_size}</p>
            {currentPuzzle.difficulty && (
              <p>Difficulty: {currentPuzzle.difficulty}</p>
            )}
            {currentPuzzle.description && (
              <p className="text-sm italic">{currentPuzzle.description}</p>
            )}
          </div>
          
          <div className="text-sm text-gray-500 mb-6">
            <p className="mb-2">Your timer will start when you click "Start Puzzle"</p>
            <div className="bg-gray-50 p-3 rounded text-left">
              <p className="font-medium mb-1">Controls:</p>
              <ul className="text-xs space-y-1">
                <li>• Arrow keys to navigate</li>
                <li>• Space to switch direction</li>
                <li>• Tab to go to next word</li>
                <li>• Shift+Tab to go to previous word</li>
                <li>• Backspace/Delete to clear and go back</li>
              </ul>
            </div>
          </div>
          
          <button
            onClick={handleStartPuzzle}
            className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Start Puzzle
          </button>
        </div>
      </div>
    </div>
  )
}