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

export const toggleUserStatus = createAsyncThunk(
  'users/toggleStatus',
  async ({ id, disabled }, { rejectWithValue, getState }) => {
    const state = getState()
    const currentUser = state.auth.user
    const targetUser = state.users.entities[id]

    const result = disabled
      ? await authService.enableUser(id)
      : await authService.deleteUser(id)

    if (result.success) {
      const newDisabled = !disabled
      if (currentUser && targetUser) {
        await logActivity({
          userId: currentUser.uid,
          username: currentUser.username || currentUser.email,
          userRole: currentUser.role,
          activityType: newDisabled ? ACTIVITY_TYPES.USER_DELETE : ACTIVITY_TYPES.USER_UPDATE,
          description: `${newDisabled ? 'Disabled' : 'Enabled'} user: ${targetUser.username || 'Unknown'}`,
          metadata: {
            targetUserId: id,
            username: targetUser.username,
            action: newDisabled ? 'disable' : 'enable'
          }
        })
      }
      return { id, disabled: newDisabled }
    } else {
      return rejectWithValue(result.error)
    }
  }
)

// Link a patient to a user
export const linkPatient = createAsyncThunk(
  'users/linkPatient',
  async ({ userId, patientId, patientName, targetUsername }, { rejectWithValue, getState }) => {
    const result = await firestoreService.linkPatientToUser(userId, patientId)
    if (!result.success) return rejectWithValue(result.error)
    const currentUser = getState().auth.user
    if (currentUser) {
      logActivity({
        userId: currentUser.uid, username: currentUser.username || currentUser.email, userRole: currentUser.role,
        activityType: ACTIVITY_TYPES.PATIENT_LINK,
        description: createActivityDescription(ACTIVITY_TYPES.PATIENT_LINK, { patientName, username: targetUsername }),
        metadata: { targetUserId: userId, patientId, patientName }
      }).catch(() => {})
    }
    return { userId, patientId }
  }
)

// Unlink a patient from a user
export const unlinkPatient = createAsyncThunk(
  'users/unlinkPatient',
  async ({ userId, patientId, patientName, targetUsername }, { rejectWithValue, getState }) => {
    const result = await firestoreService.unlinkPatientFromUser(userId, patientId)
    if (!result.success) return rejectWithValue(result.error)
    const currentUser = getState().auth.user
    if (currentUser) {
      logActivity({
        userId: currentUser.uid, username: currentUser.username || currentUser.email, userRole: currentUser.role,
        activityType: ACTIVITY_TYPES.PATIENT_UNLINK,
        description: createActivityDescription(ACTIVITY_TYPES.PATIENT_UNLINK, { patientName, username: targetUsername }),
        metadata: { targetUserId: userId, patientId, patientName }
      }).catch(() => {})
    }
    return { userId, patientId }
  }
)

// Auto-link patients by matching mobile number
export const autoLinkByMobile = createAsyncThunk(
  'users/autoLinkByMobile',
  async ({ userId, userMobile, targetUsername }, { rejectWithValue, getState }) => {
    const state = getState()
    const patients = Object.values(state.patients.entities).filter(Boolean)
    const matchingIds = patients
      .filter(p => p.mobile && p.mobile.replace(/\s+/g, '') === userMobile.replace(/\s+/g, '') && !p.linkedUserId)
      .map(p => p.id)
    if (matchingIds.length === 0) return { userId, linkedIds: [] }
    const result = await firestoreService.bulkLinkPatients(userId, matchingIds)
    if (!result.success) return rejectWithValue(result.error)
    const currentUser = state.auth.user
    if (currentUser) {
      logActivity({
        userId: currentUser.uid, username: currentUser.username || currentUser.email, userRole: currentUser.role,
        activityType: ACTIVITY_TYPES.PATIENT_AUTO_LINK,
        description: createActivityDescription(ACTIVITY_TYPES.PATIENT_AUTO_LINK, { count: matchingIds.length, username: targetUsername }),
        metadata: { targetUserId: userId, linkedPatientIds: matchingIds }
      }).catch(() => {})
    }
    return { userId, linkedIds: matchingIds }
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
      // Toggle user status
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        usersAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { disabled: action.payload.disabled }
        })
      })
      // Link patient
      .addCase(linkPatient.fulfilled, (state, action) => {
        const { userId, patientId } = action.payload
        const user = state.entities[userId]
        if (user) {
          const linked = [...(user.linkedPatients || []), patientId]
          usersAdapter.updateOne(state, { id: userId, changes: { linkedPatients: linked } })
        }
      })
      // Unlink patient
      .addCase(unlinkPatient.fulfilled, (state, action) => {
        const { userId, patientId } = action.payload
        const user = state.entities[userId]
        if (user) {
          const linked = (user.linkedPatients || []).filter(id => id !== patientId)
          usersAdapter.updateOne(state, { id: userId, changes: { linkedPatients: linked } })
        }
      })
      // Auto-link by mobile
      .addCase(autoLinkByMobile.fulfilled, (state, action) => {
        const { userId, linkedIds } = action.payload
        if (linkedIds.length === 0) return
        const user = state.entities[userId]
        if (user) {
          const linked = [...new Set([...(user.linkedPatients || []), ...linkedIds])]
          usersAdapter.updateOne(state, { id: userId, changes: { linkedPatients: linked } })
        }
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
