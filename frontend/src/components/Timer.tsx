import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import { startTimer, stopTimer, updateTimer } from '../store/puzzleSlice'

export default function Timer() {
  const dispatch = useDispatch<AppDispatch>()
  const { startTime, elapsedTime, isTimerRunning } = useSelector(
    (state: RootState) => state.puzzle
  )

  // Timer will be started manually by the StartPuzzleOverlay

  // Update timer every second when running
  useEffect(() => {
    if (isTimerRunning) {
      const interval = setInterval(() => {
        dispatch(updateTimer())
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isTimerRunning, dispatch])

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const currentElapsed = isTimerRunning && startTime 
    ? elapsedTime + (Date.now() - startTime)
    : elapsedTime

  const handleToggleTimer = () => {
    if (isTimerRunning) {
      dispatch(stopTimer())
    } else {
      dispatch(startTimer())
    }
  }


  return (
    <div className="bg-white p-3 rounded-lg shadow mb-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-mono font-bold text-gray-900">
            {formatTime(currentElapsed)}
          </div>
          <div className="text-sm text-gray-600">
            {isTimerRunning ? 'Running' : 'Paused'}
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleToggleTimer}
            className={`px-3 py-1 rounded text-sm font-medium ${
              isTimerRunning 
                ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isTimerRunning ? 'Pause' : 'Start'}
          </button>
        </div>
      </div>
    </div>
  )
}