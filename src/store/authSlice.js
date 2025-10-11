import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  isAuthenticated: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      state.user = action.payload
      state.isAuthenticated = true
      localStorage.setItem('user', JSON.stringify(action.payload))
    },
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      localStorage.removeItem('user')
    },
    loadUser: (state) => {
      const user = localStorage.getItem('user')
      if (user) {
        state.user = JSON.parse(user)
        state.isAuthenticated = true
      }
    },
  },
})

export const { login, logout, loadUser } = authSlice.actions
export default authSlice.reducer
