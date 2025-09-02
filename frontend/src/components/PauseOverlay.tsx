import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import { startTimer } from '../store/puzzleSlice'

export default function PauseOverlay() {
  const dispatch = useDispatch<AppDispatch>()
  const { isTimerRunning, elapsedTime } = useSelector(
    (state: RootState) => state.puzzle
  )

  // Don't show overlay if timer is running or hasn't been started yet (elapsedTime === 0)
  if (isTimerRunning || elapsedTime === 0) {
    return null
  }

  const handleResume = () => {
    dispatch(startTimer())
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="text-4xl mb-4">⏸️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Puzzle Paused
          </h2>
          <p className="text-gray-600 mb-6">
            The timer is paused. Click resume to continue solving.
          </p>
          
          <button
            onClick={handleResume}
            className="w-full bg-green-500 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-green-600 transition-colors"
          >
            Resume Puzzle
          </button>
          
          <p className="text-sm text-gray-500 mt-4">
            Press any key or click resume to continue
          </p>
        </div>
      </div>
    </div>
  )
}