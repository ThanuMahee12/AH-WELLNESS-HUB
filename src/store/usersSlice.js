import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit'
import { firestoreService } from '../services/firestoreService'
import { authService } from '../services/authService'
import { registerUser } from './authSlice'
import { logActivity, ACTIVITY_TYPES, createActivityDescription } from '../services/activityService'

const COLLECTION = 'users'

// Create entity adapter
const usersAdapter = createEntityAdapter({
  selectId: (user) => user.id,
  sortComparer: (a, b) => b.username.localeCompare(a.username)
})

const initialState = usersAdapter.getInitialState({
  loading: false,
  error: null,
})

// Async thunks for Firestore operations
export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (_, { rejectWithValue }) => {
    const result = await firestoreService.getAll(COLLECTION)
    if (result.success) {
      // Filter out disabled users from the admin list
      const activeUsers = result.data.filter(user => !user.disabled)
      return activeUsers
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
  async ({ id, ...userData }, { rejectWithValue, getState }) => {
    const state = getState()
    const currentUser = state.auth.user

    const result = await firestoreService.update(COLLECTION, id, userData)
    if (result.success) {
      // Log activity
      if (currentUser) {
        await logActivity({
          userId: currentUser.uid,
          username: currentUser.username || currentUser.email,
          userRole: currentUser.role,
          activityType: ACTIVITY_TYPES.USER_UPDATE,
          description: createActivityDescription(ACTIVITY_TYPES.USER_UPDATE, {
            username: userData.username || 'Unknown'
          }),
          metadata: {
            targetUserId: id,
            username: userData.username,
            role: userData.role,
            updatedFields: Object.keys(userData)
          }
        })
      }
      return { id, ...userData }
    } else {
      return rejectWithValue(result.error)
    }
  }
)

export const deleteUser = createAsyncThunk(
  'users/delete',
  async (id, { rejectWithValue, getState }) => {
    const state = getState()
    const currentUser = state.auth.user
    const targetUser = state.users.entities[id]

    // Use authService to mark user as deleted
    const result = await authService.deleteUser(id)
    if (result.success) {
      // Log activity
      if (currentUser && targetUser) {
        await logActivity({
          userId: currentUser.uid,
          username: currentUser.username || currentUser.email,
          userRole: currentUser.role,
          activityType: ACTIVITY_TYPES.USER_DELETE,
          description: createActivityDescription(ACTIVITY_TYPES.USER_DELETE, {
            username: targetUser.username || 'Unknown'
          }),
          metadata: {
            targetUserId: id,
            username: targetUser.username,
            role: targetUser.role
          }
        })
      }
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
        usersAdapter.setAll(state, action.payload)
        state.loading = false
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Add user to list (after registration)
      .addCase(addUserToList.fulfilled, (state, action) => {
        usersAdapter.addOne(state, action.payload)
      })
      // Update user
      .addCase(updateUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        usersAdapter.updateOne(state, {
          id: action.payload.id,
          changes: action.payload
        })
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
        usersAdapter.removeOne(state, action.payload)
        state.loading = false
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Listen to registerUser from authSlice
      .addCase(registerUser.fulfilled, (state, action) => {
        // Ensure the user has an id field for consistency
        const user = {
          id: action.payload.uid,
          ...action.payload
        }
        usersAdapter.addOne(state, user)
      })
  },
})

export const { clearError } = usersSlice.actions

// Export entity adapter selectors
export const {
  selectAll: selectAllUsers,
  selectById: selectUserById,
  selectIds: selectUserIds,
} = usersAdapter.getSelectors((state) => state.users)

export default usersSlice.reducer
