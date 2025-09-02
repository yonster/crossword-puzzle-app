import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { RootState, AppDispatch } from '../store/store'
import { fetchPuzzles } from '../store/puzzleSlice'

export default function HomePage() {
  const dispatch = useDispatch<AppDispatch>()
  const { puzzles } = useSelector((state: RootState) => state.puzzle)

  useEffect(() => {
    dispatch(fetchPuzzles())
  }, [dispatch])

  return (
    <div className="px-4 py-5 sm:px-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Browse Puzzles</h1>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {puzzles.map((puzzle) => (
          <Link
            key={puzzle.id}
            to={`/puzzle/${puzzle.id}`}
            className="block p-6 bg-white rounded-lg border border-gray-200 shadow hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {puzzle.title}
            </h2>
            <p className="text-gray-600">
              Grid Size: {puzzle.grid_size}x{puzzle.grid_size}
            </p>
          </Link>
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