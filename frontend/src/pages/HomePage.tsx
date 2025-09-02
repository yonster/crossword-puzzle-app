import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { RootState, AppDispatch } from '../store/store'
import { fetchPuzzles, deletePuzzle } from '../store/puzzleSlice'

export default function HomePage() {
  const dispatch = useDispatch<AppDispatch>()
  const { puzzles } = useSelector((state: RootState) => state.puzzle)
  const { token, user } = useSelector((state: RootState) => state.auth)
  const [deletingPuzzles, setDeletingPuzzles] = useState<Set<number>>(new Set())

  useEffect(() => {
    dispatch(fetchPuzzles())
  }, [dispatch])

  // Delete buttons will only show for puzzles owned by the current user

  const handleDeletePuzzle = async (puzzleId: number, puzzleTitle: string) => {
    if (!token) {
      alert('Please login to delete puzzles')
      return
    }

    if (!confirm(`Are you sure you want to delete "${puzzleTitle}"? This action cannot be undone.`)) {
      return
    }

    setDeletingPuzzles(prev => new Set(prev).add(puzzleId))
    
    try {
      await dispatch(deletePuzzle(puzzleId)).unwrap()
    } catch (error: any) {
      console.error('Delete puzzle error:', error)
      if (error.message?.includes('403') || error.message?.includes('Not authorized')) {
        alert('You can only delete puzzles that you created.')
      } else if (error.message?.includes('404')) {
        alert('Puzzle not found or has already been deleted.')
      } else {
        alert('Failed to delete puzzle. Please try again.')
      }
    } finally {
      setDeletingPuzzles(prev => {
        const newSet = new Set(prev)
        newSet.delete(puzzleId)
        return newSet
      })
    }
  }

  return (
    <div className="px-4 py-5 sm:px-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Browse Puzzles</h1>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {puzzles.map((puzzle) => (
          <div
            key={puzzle.id}
            className="relative p-6 bg-white rounded-lg border border-gray-200 shadow hover:shadow-lg transition-shadow"
          >
            {token && user && puzzle.author_id === user.id && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  handleDeletePuzzle(puzzle.id, puzzle.title)
                }}
                disabled={deletingPuzzles.has(puzzle.id)}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm transition-colors"
                title="Delete puzzle"
              >
                {deletingPuzzles.has(puzzle.id) ? '...' : '×'}
              </button>
            )}
            
            <Link to={`/puzzle/${puzzle.id}`} className="block">
              <h2 className="text-xl font-bold text-gray-900 mb-2 pr-8">
                {puzzle.title}
              </h2>
              <p className="text-gray-600">
                Grid Size: {puzzle.grid_size}x{puzzle.grid_size}
              </p>
            </Link>
          </div>
        ))}
      </div>
      
      {puzzles.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No puzzles available. Create one to get started!
        </p>
      )}
    </div>
  )
}