import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { RootState } from '../store/store'

export default function CreatePuzzlePage() {
  const navigate = useNavigate()
  const { token } = useSelector((state: RootState) => state.auth)
  const [file, setFile] = useState<File | null>(null)
  const [uploadType, setUploadType] = useState<'puz' | 'nyt'>('puz')
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      
      // Auto-detect file type
      if (selectedFile.name.endsWith('.puz')) {
        setUploadType('puz')
      } else if (selectedFile.name.endsWith('.json')) {
        setUploadType('nyt')
      }
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file')
      return
    }

    setIsUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post('/api/puzzles/import', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })
      
      navigate(`/puzzle/${response.data.id}`)
    } catch (err: any) {
      setError('Failed to upload puzzle. Please check the file format.')
    } finally {
      setIsUploading(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">Please login to create puzzles</p>
        <button
          onClick={() => navigate('/login')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Go to Login
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 sm:px-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create Puzzle</h1>
      
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Import Puzzle File
          </h3>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="puz"
                    checked={uploadType === 'puz'}
                    onChange={(e) => setUploadType(e.target.value as 'puz')}
                    className="mr-2"
                  />
                  .puz File (Across Lite format)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="nyt"
                    checked={uploadType === 'nyt'}
                    onChange={(e) => setUploadType(e.target.value as 'nyt')}
                    className="mr-2"
                  />
                  NYT JSON Format
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File
              </label>
              <input
                type="file"
                accept={uploadType === 'puz' ? '.puz' : '.json'}
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Uploading...' : 'Upload Puzzle'}
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
          
          <div className="mt-6 text-sm text-gray-600">
            <p className="font-medium mb-2">Supported formats:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>.puz files</strong> - Across Lite format (most common crossword format)</li>
              <li><strong>NYT JSON</strong> - New York Times submission format</li>
            </ul>
            <p className="mt-2">Grid sizes supported: 5x5 to 25x25</p>
          </div>
        </div>
      </div>
    </div>
  )
}