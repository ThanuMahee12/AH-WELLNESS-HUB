import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { firestoreService } from '../services/firestoreService'
import { registerUser } from './authSlice'

const COLLECTION = 'users'

const initialState = {
  users: [],
  loading: false,
  error: null,
}

// Async thunks for Firestore operations
export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (_, { rejectWithValue }) => {
    const result = await firestoreService.getAll(COLLECTION)
    if (result.success) {
      return result.data
    } else {
      return rejectWithValue(result.error)
    }
  }
)

// Add user is handled by registerUser in authSlice
// This thunk is for updating user list after registration
export const addUserToList = createAsyncThunk(
  'users/addToList',
  async (userData, { rejectWithValue }) => {
    try {
      return userData
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateUser = createAsyncThunk(
  'users/update',
  async ({ id, ...userData }, { rejectWithValue }) => {
    const result = await firestoreService.update(COLLECTION, id, userData)
    if (result.success) {
      return { id, ...userData }
    } else {
      return rejectWithValue(result.error)
    }
  }
)

export const deleteUser = createAsyncThunk(
  'users/delete',
  async (id, { rejectWithValue }) => {
    const result = await firestoreService.delete(COLLECTION, id)
    if (result.success) {
      return id
    } else {
      return rejectWithValue(result.error)
    }
  }
)

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.users = action.payload
        state.loading = false
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Add user to list (after registration)
      .addCase(addUserToList.fulfilled, (state, action) => {
        state.users.unshift(action.payload)
      })
      // Update user
      .addCase(updateUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(u => u.id === action.payload.id)
        if (index !== -1) {
          state.users[index] = action.payload
        }
        state.loading = false
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(u => u.id !== action.payload)
        state.loading = false
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Listen to registerUser from authSlice
      .addCase(registerUser.fulfilled, (state, action) => {
        state.users.unshift(action.payload)
      })
  },
})

export const { clearError } = usersSlice.actions
export default usersSlice.reducer
