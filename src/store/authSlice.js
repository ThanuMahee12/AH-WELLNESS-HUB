import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authService } from '../services/authService'
import { logActivity, ACTIVITY_TYPES, createActivityDescription } from '../services/activityService'

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true, // Start as true to wait for auth check
  error: null,
  authChecked: false, // Track if initial auth check is complete
}

// Async thunks for Firebase authentication
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    const result = await authService.login(email, password)
    if (result.success) {
      // Log login activity
      await logActivity({
        userId: result.user.uid,
        username: result.user.username || result.user.email,
        userRole: result.user.role,
        activityType: ACTIVITY_TYPES.LOGIN,
        description: createActivityDescription(ACTIVITY_TYPES.LOGIN),
        metadata: { email: result.user.email }
      })
      return result.user
    } else {
      return rejectWithValue(result.error)
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    const result = await authService.register(userData)
    if (result.success) {
      return result.user
    } else {
      return rejectWithValue(result.error)
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue, getState }) => {
    const { user } = getState().auth

    // Log logout activity before logging out
    if (user) {
      await logActivity({
        userId: user.uid,
        username: user.username || user.email,
        userRole: user.role,
        activityType: ACTIVITY_TYPES.LOGOUT,
        description: createActivityDescription(ACTIVITY_TYPES.LOGOUT),
        metadata: { email: user.email }
      })
    }

    const result = await authService.logout()
    if (result.success) {
      return null
    } else {
      return rejectWithValue(result.error)
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload
      state.isAuthenticated = !!action.payload
      state.loading = false
      state.authChecked = true // Mark auth check as complete
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = true
        state.loading = false
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false
        state.error = null
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.loading = false
        state.error = null
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { setUser, clearError } = authSlice.actions
export default authSlice.reducer
