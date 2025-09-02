import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from './store/store'
import { fetchCurrentUser } from './store/authSlice'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import PuzzlePage from './pages/PuzzlePage'
import CreatePuzzlePage from './pages/CreatePuzzlePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function App() {
  const dispatch = useDispatch<AppDispatch>()
  const { token, user } = useSelector((state: RootState) => state.auth)

  // Fetch current user if token exists but user data is not loaded
  useEffect(() => {
    if (token && !user) {
      dispatch(fetchCurrentUser())
    }
  }, [token, user, dispatch])
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/puzzle/:id" element={<PuzzlePage />} />
        <Route path="/create" element={<CreatePuzzlePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </Layout>
  )
}

export default App