import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit'
import { firestoreService } from '../services/firestoreService'
import { generateCheckupSerialNumber } from '../utils/serialNumberGenerator'
import { logActivity, ACTIVITY_TYPES, createActivityDescription } from '../services/activityService'

const COLLECTION = 'checkups'

// Create entity adapter
const checkupsAdapter = createEntityAdapter({
  selectId: (checkup) => checkup.id,
  sortComparer: (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
})

const initialState = checkupsAdapter.getInitialState({
  loading: false,
  error: null,
})

// Async thunks for Firestore operations
export const fetchCheckups = createAsyncThunk(
  'checkups/fetchAll',
  async (_, { rejectWithValue }) => {
    const result = await firestoreService.getAll(COLLECTION)
    if (result.success) {
      return result.data
    } else {
      return rejectWithValue(result.error)
    }
  }
)

export const addCheckup = createAsyncThunk(
  'checkups/add',
  async (checkupData, { rejectWithValue, getState }) => {
    const state = getState()
    const user = state.auth.user

    // Generate unique serial number
    const serialNumber = generateCheckupSerialNumber()

    // Generate bill number in YYYYMMDDHHMMSS format
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    const billNo = `${year}${month}${day}${hours}${minutes}${seconds}`

    const dataWithMetadata = {
      ...checkupData,
      serialNumber, // Add 12-digit serial number
      billNo, // Add bill number (YYYYMMDDHHMMSS format)
      timestamp: new Date().toISOString(),
      createdBy: user?.uid || 'system',
      createdByName: user?.username || 'System',
    }
    const result = await firestoreService.create(COLLECTION, dataWithMetadata)
    if (result.success) {
      // Log activity
      if (user) {
        await logActivity({
          userId: user.uid,
          username: user.username || user.email,
          userRole: user.role,
          activityType: ACTIVITY_TYPES.CHECKUP_CREATE,
          description: createActivityDescription(ACTIVITY_TYPES.CHECKUP_CREATE, {
            patientName: checkupData.patientName,
            billNo: billNo
          }),
          metadata: {
            checkupId: result.id,
            billNo: billNo,
            patientId: checkupData.patientId,
            patientName: checkupData.patientName,
            total: checkupData.total,
            testsCount: checkupData.tests?.length || 0,
            medicinesCount: checkupData.medicines?.length || 0
          }
        })
      }
      return { id: result.id, ...dataWithMetadata }
    } else {
      return rejectWithValue(result.error)
    }
  }
)

export const updateCheckup = createAsyncThunk(
  'checkups/update',
  async ({ id, ...checkupData }, { rejectWithValue, getState }) => {
    const state = getState()
    const user = state.auth.user

    const result = await firestoreService.update(COLLECTION, id, checkupData)
    if (result.success) {
      // Log activity
      if (user) {
        await logActivity({
          userId: user.uid,
          username: user.username || user.email,
          userRole: user.role,
          activityType: ACTIVITY_TYPES.CHECKUP_UPDATE,
          description: createActivityDescription(ACTIVITY_TYPES.CHECKUP_UPDATE, {
            billNo: checkupData.billNo,
            checkupId: id
          }),
          metadata: {
            checkupId: id,
            billNo: checkupData.billNo,
            patientId: checkupData.patientId,
            patientName: checkupData.patientName,
            updatedFields: Object.keys(checkupData)
          }
        })
      }
      return { id, ...checkupData }
    } else {
      return rejectWithValue(result.error)
    }
  }
)

export const deleteCheckup = createAsyncThunk(
  'checkups/delete',
  async (id, { rejectWithValue, getState }) => {
    const state = getState()
    const user = state.auth.user
    const checkup = state.checkups.entities[id]

    const result = await firestoreService.delete(COLLECTION, id)
    if (result.success) {
      // Log activity
      if (user && checkup) {
        await logActivity({
          userId: user.uid,
          username: user.username || user.email,
          userRole: user.role,
          activityType: ACTIVITY_TYPES.CHECKUP_DELETE,
          description: createActivityDescription(ACTIVITY_TYPES.CHECKUP_DELETE, {
            billNo: checkup.billNo,
            checkupId: id
          }),
          metadata: {
            checkupId: id,
            billNo: checkup.billNo,
            patientId: checkup.patientId,
            patientName: checkup.patientName
          }
        })
      }
      return id
    } else {
      return rejectWithValue(result.error)
    }
  }
)

const checkupsSlice = createSlice({
  name: 'checkups',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch checkups
      .addCase(fetchCheckups.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCheckups.fulfilled, (state, action) => {
        checkupsAdapter.setAll(state, action.payload)
        state.loading = false
      })
      .addCase(fetchCheckups.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Add checkup
      .addCase(addCheckup.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addCheckup.fulfilled, (state, action) => {
        checkupsAdapter.addOne(state, action.payload)
        state.loading = false
      })
      .addCase(addCheckup.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update checkup
      .addCase(updateCheckup.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateCheckup.fulfilled, (state, action) => {
        checkupsAdapter.updateOne(state, {
          id: action.payload.id,
          changes: action.payload
        })
        state.loading = false
      })
      .addCase(updateCheckup.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Delete checkup
      .addCase(deleteCheckup.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteCheckup.fulfilled, (state, action) => {
        checkupsAdapter.removeOne(state, action.payload)
        state.loading = false
      })
      .addCase(deleteCheckup.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError } = checkupsSlice.actions

// Export entity adapter selectors
export const {
  selectAll: selectAllCheckups,
  selectById: selectCheckupById,
  selectIds: selectCheckupIds,
} = checkupsAdapter.getSelectors((state) => state.checkups)

export default checkupsSlice.reducer
