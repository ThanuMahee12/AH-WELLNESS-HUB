import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit'
import { firestoreService } from '../services/firestoreService'
import { EDIT_REQUEST_STATUS, EDIT_REQUEST_TYPES } from '../constants/roles'

const COLLECTION = 'editRequests'

// Create entity adapter
const editRequestsAdapter = createEntityAdapter({
  selectId: (request) => request.id,
  sortComparer: (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
})

const initialState = editRequestsAdapter.getInitialState({
  loading: false,
  error: null,
})

// Async thunks for Firestore operations
export const fetchEditRequests = createAsyncThunk(
  'editRequests/fetchAll',
  async (_, { rejectWithValue }) => {
    const result = await firestoreService.getAll(COLLECTION)
    if (result.success) {
      return result.data
    } else {
      return rejectWithValue(result.error)
    }
  }
)

export const createEditRequest = createAsyncThunk(
  'editRequests/create',
  async (requestData, { rejectWithValue, getState }) => {
    const { auth } = getState()
    const dataWithMetadata = {
      ...requestData,
      requestedBy: auth.user.id,
      requestedByName: auth.user.username,
      requestedByRole: auth.user.role,
      status: EDIT_REQUEST_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await firestoreService.create(COLLECTION, dataWithMetadata)
    if (result.success) {
      return { id: result.id, ...dataWithMetadata }
    } else {
      return rejectWithValue(result.error)
    }
  }
)

export const approveEditRequest = createAsyncThunk(
  'editRequests/approve',
  async ({ id, approverNotes = '' }, { rejectWithValue, getState }) => {
    const { auth } = getState()
    const updateData = {
      status: EDIT_REQUEST_STATUS.APPROVED,
      approvedBy: auth.user.id,
      approvedByName: auth.user.username,
      approverNotes,
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await firestoreService.update(COLLECTION, id, updateData)
    if (result.success) {
      return { id, ...updateData }
    } else {
      return rejectWithValue(result.error)
    }
  }
)

export const rejectEditRequest = createAsyncThunk(
  'editRequests/reject',
  async ({ id, rejectionReason = '' }, { rejectWithValue, getState }) => {
    const { auth } = getState()
    const updateData = {
      status: EDIT_REQUEST_STATUS.REJECTED,
      rejectedBy: auth.user.id,
      rejectedByName: auth.user.username,
      rejectionReason,
      rejectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await firestoreService.update(COLLECTION, id, updateData)
    if (result.success) {
      return { id, ...updateData }
    } else {
      return rejectWithValue(result.error)
    }
  }
)

export const deleteEditRequest = createAsyncThunk(
  'editRequests/delete',
  async (id, { rejectWithValue }) => {
    const result = await firestoreService.delete(COLLECTION, id)
    if (result.success) {
      return id
    } else {
      return rejectWithValue(result.error)
    }
  }
)

const editRequestsSlice = createSlice({
  name: 'editRequests',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch edit requests
      .addCase(fetchEditRequests.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchEditRequests.fulfilled, (state, action) => {
        editRequestsAdapter.setAll(state, action.payload)
        state.loading = false
      })
      .addCase(fetchEditRequests.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Create edit request
      .addCase(createEditRequest.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createEditRequest.fulfilled, (state, action) => {
        editRequestsAdapter.addOne(state, action.payload)
        state.loading = false
      })
      .addCase(createEditRequest.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Approve edit request
      .addCase(approveEditRequest.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(approveEditRequest.fulfilled, (state, action) => {
        editRequestsAdapter.updateOne(state, {
          id: action.payload.id,
          changes: action.payload
        })
        state.loading = false
      })
      .addCase(approveEditRequest.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Reject edit request
      .addCase(rejectEditRequest.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(rejectEditRequest.fulfilled, (state, action) => {
        editRequestsAdapter.updateOne(state, {
          id: action.payload.id,
          changes: action.payload
        })
        state.loading = false
      })
      .addCase(rejectEditRequest.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Delete edit request
      .addCase(deleteEditRequest.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteEditRequest.fulfilled, (state, action) => {
        editRequestsAdapter.removeOne(state, action.payload)
        state.loading = false
      })
      .addCase(deleteEditRequest.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError } = editRequestsSlice.actions

// Export entity adapter selectors
export const {
  selectAll: selectAllEditRequests,
  selectById: selectEditRequestById,
  selectIds: selectEditRequestIds,
} = editRequestsAdapter.getSelectors((state) => state.editRequests)

// Custom selectors
export const selectPendingEditRequests = (state) => {
  const allRequests = selectAllEditRequests(state)
  return allRequests.filter(req => req.status === EDIT_REQUEST_STATUS.PENDING)
}

export const selectUserEditRequests = (userId) => (state) => {
  const allRequests = selectAllEditRequests(state)
  return allRequests.filter(req => req.requestedBy === userId)
}

export const selectEditRequestsByType = (type) => (state) => {
  const allRequests = selectAllEditRequests(state)
  return allRequests.filter(req => req.type === type)
}

export default editRequestsSlice.reducer
