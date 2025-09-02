import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import puzzleReducer from './puzzleSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    puzzle: puzzleReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch