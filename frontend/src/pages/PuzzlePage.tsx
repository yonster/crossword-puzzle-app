import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import { fetchPuzzle, fetchProgress, saveProgress, startTimer, stopTimer } from '../store/puzzleSlice'
import CrosswordGrid from '../components/CrosswordGrid'
import ClueList from '../components/ClueList'
import PuzzleControls from '../components/PuzzleControls'
import Timer from '../components/Timer'
import ClueDisplay from '../components/ClueDisplay'
import PauseOverlay from '../components/PauseOverlay'
import StartPuzzleOverlay from '../components/StartPuzzleOverlay'
import CompletionModal from '../components/CompletionModal'
import { playCompletionJingle } from '../utils/completionSound'

export default function PuzzlePage() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useDispatch<AppDispatch>()
  const { currentPuzzle, userGrid, isLoading, isTimerRunning, elapsedTime, isCompleted } = useSelector(
    (state: RootState) => state.puzzle
  )
  const { token } = useSelector((state: RootState) => state.auth)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  
  // Use refs to track current values for the cleanup function
  const currentValuesRef = useRef({ isTimerRunning, token, currentPuzzle, userGrid })
  currentValuesRef.current = { isTimerRunning, token, currentPuzzle, userGrid }

  useEffect(() => {
    if (id) {
      dispatch(fetchPuzzle(parseInt(id)))
    }
  }, [id, dispatch])

  // Fetch progress after puzzle loads
  useEffect(() => {
    if (currentPuzzle && token && id) {
      dispatch(fetchProgress(parseInt(id)))
    }
  }, [currentPuzzle, token, id, dispatch])

  // Handle keyboard events to resume timer when paused
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // If timer is paused (not running but has elapsed time), resume it
      if (!isTimerRunning && elapsedTime > 0) {
        dispatch(startTimer())
      }
    }

    // Add event listener when puzzle is loaded and timer is paused
    if (currentPuzzle && !isTimerRunning && elapsedTime > 0) {
      document.addEventListener('keydown', handleKeyPress)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [currentPuzzle, isTimerRunning, elapsedTime, dispatch])

  // Auto-save progress every 10 seconds
  useEffect(() => {
    if (!token || !currentPuzzle) return
    const interval = setInterval(() => {
      dispatch(saveProgress({
        puzzleId: currentPuzzle.id,
        state: userGrid
      }))
    }, 10000)
    return () => clearInterval(interval)
  }, [token, currentPuzzle, userGrid, dispatch])

  // Save progress and pause timer when leaving the puzzle
  useEffect(() => {
    return () => {
      const { isTimerRunning, token, currentPuzzle, userGrid } = currentValuesRef.current
      
      // Pause the timer when leaving the page
      if (isTimerRunning) {
        dispatch(stopTimer())
      }
      
      // Save progress
      if (token && currentPuzzle && Object.keys(userGrid).length > 0) {
        dispatch(saveProgress({
          puzzleId: currentPuzzle.id,
          state: userGrid
        }))
      }
    }
  }, [dispatch]) // Only depend on dispatch

  // Save progress immediately when puzzle is completed
  useEffect(() => {
    if (isCompleted && token && currentPuzzle) {
      dispatch(saveProgress({
        puzzleId: currentPuzzle.id,
        state: userGrid
      }))
    }
  }, [isCompleted, token, currentPuzzle, userGrid, dispatch])

  // Show completion modal and play sound when puzzle is completed
  useEffect(() => {
    if (isCompleted) {
      // Play the completion jingle immediately
      playCompletionJingle()
      
      // Small delay to allow completion animation to be seen
      setTimeout(() => {
        setShowCompletionModal(true)
      }, 500)
    }
  }, [isCompleted])

  // Pause timer when tab becomes inactive (user switches tabs/minimizes)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isTimerRunning) {
        // Tab became inactive, pause the timer
        dispatch(stopTimer())
      }
    }

    const handleBeforeUnload = () => {
      if (isTimerRunning) {
        // Browser/tab is closing, pause the timer
        dispatch(stopTimer())
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isTimerRunning, dispatch])

  if (isLoading) {
    return <div className="text-center py-8">Loading puzzle...</div>
  }

  if (!currentPuzzle) {
    return <div className="text-center py-8">Puzzle not found</div>
  }

  const isPaused = !isTimerRunning && elapsedTime > 0
  const showingStartOverlay = !isTimerRunning && elapsedTime === 0

  return (
    <div className="px-4 py-5 sm:px-6">
      <div className={isPaused || showingStartOverlay ? 'blur-sm pointer-events-none select-none' : ''}>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {currentPuzzle.title}
        </h1>
        
        {isCompleted && (
          <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">Congratulations! You completed the puzzle!</p>
                <p className="text-sm mt-1">Final time: {Math.floor(elapsedTime / 60000)}:{String(Math.floor((elapsedTime % 60000) / 1000)).padStart(2, '0')}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-8">
          <div className="flex-shrink-0">
            <CrosswordGrid />
            
            <div className="mt-4 text-sm text-gray-600">
              <p>Use arrow keys to navigate</p>
              <p>Press Space to switch direction</p>
              <p>Press Tab to move to next word</p>
              <p>Press Shift+Tab to move to previous word</p>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
                <ClueList />
              </div>
              <div>
                <Timer />
                <ClueDisplay />
                <PuzzleControls />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <StartPuzzleOverlay />
      <PauseOverlay />
      
      {showCompletionModal && (
        <CompletionModal onClose={() => setShowCompletionModal(false)} />
      )}
    </div>
  )
}