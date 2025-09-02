import { useSelector } from 'react-redux'
import { RootState } from '../store/store'
import { useState, useEffect } from 'react'

interface CompletionModalProps {
  onClose: () => void
}

export default function CompletionModal({ onClose }: CompletionModalProps) {
  const { elapsedTime, currentPuzzle } = useSelector(
    (state: RootState) => state.puzzle
  )
  const [showModal, setShowModal] = useState(true)

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const remainingSeconds = totalSeconds % 60
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
  }

  const handleClose = () => {
    setShowModal(false)
    setTimeout(onClose, 300) // Allow animation to complete
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  if (!showModal) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg p-8 max-w-md w-full mx-4 transform transition-all duration-300 ${
        showModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            🎉 Congratulations! 🎉
          </h3>
          
          <p className="text-sm text-gray-500 mb-4">
            You've successfully completed "{currentPuzzle?.title}"!
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {formatTime(elapsedTime)}
            </div>
            <div className="text-sm text-gray-600">
              Final Time
            </div>
          </div>
          
          <div className="text-xs text-gray-500 mb-6">
            🌟 Amazing work solving this crossword puzzle! 🌟
          </div>
          
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            onClick={handleClose}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}