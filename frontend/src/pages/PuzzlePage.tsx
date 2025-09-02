import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import { fetchPuzzle, saveProgress } from '../store/puzzleSlice'
import CrosswordGrid from '../components/CrosswordGrid'
import ClueList from '../components/ClueList'
import PuzzleControls from '../components/PuzzleControls'
import Timer from '../components/Timer'
import ClueDisplay from '../components/ClueDisplay'

export default function PuzzlePage() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useDispatch<AppDispatch>()
  const { currentPuzzle, userGrid, isLoading } = useSelector(
    (state: RootState) => state.puzzle
  )
  const { token } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (id) {
      dispatch(fetchPuzzle(parseInt(id)))
    }
  }, [id, dispatch])

  // Auto-save disabled for now - will be re-enabled when authentication is fully implemented
  // useEffect(() => {
  //   if (!token || !currentPuzzle) return
  //   const interval = setInterval(() => {
  //     dispatch(saveProgress({
  //       puzzleId: currentPuzzle.id,
  //       state: userGrid
  //     }))
  //   }, 10000)
  //   return () => clearInterval(interval)
  // }, [token, currentPuzzle, userGrid, dispatch])

  if (isLoading) {
    return <div className="text-center py-8">Loading puzzle...</div>
  }

  if (!currentPuzzle) {
    return <div className="text-center py-8">Puzzle not found</div>
  }

  return (
    <div className="px-4 py-5 sm:px-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {currentPuzzle.title}
      </h1>
      
      <div className="flex gap-8">
        <div className="flex-shrink-0">
          <CrosswordGrid />
          
          <div className="mt-4 text-sm text-gray-600">
            <p>Use arrow keys to navigate</p>
            <p>Press Space to switch direction</p>
            <p>Press Tab to move to next word</p>
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
  )
}