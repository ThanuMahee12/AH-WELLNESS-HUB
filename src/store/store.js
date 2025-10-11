import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import testsReducer from './testsSlice'
import patientsReducer from './patientsSlice'
import checkupsReducer from './checkupsSlice'
import usersReducer from './usersSlice'

const store = configureStore({
  reducer: {
    auth: authReducer,
    tests: testsReducer,
    patients: patientsReducer,
    checkups: checkupsReducer,
    users: usersReducer,
  },
})

export default store
