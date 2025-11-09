import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit'
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { notifyRoleRequestSubmitted, notifyRoleRequestApproved, notifyRoleRequestRejected } from '../services/notificationService'

const userChangeRequestsAdapter = createEntityAdapter()

const initialState = userChangeRequestsAdapter.getInitialState({
  loading: false,
  error: null,
})

// Fetch all change requests
export const fetchUserChangeRequests = createAsyncThunk(
  'userChangeRequests/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'userChangeRequests'))
      const requests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      return requests
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Helper function to get superadmin ID
const getSuperadminId = async () => {
  try {
    const usersSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'superadmin')))
    if (!usersSnapshot.empty) {
      return usersSnapshot.docs[0].id
    }
    return null
  } catch (error) {
    console.error('Error getting superadmin:', error)
    return null
  }
}

// Create a change request (for maintainer)
export const createUserChangeRequest = createAsyncThunk(
  'userChangeRequests/create',
  async (requestData, { rejectWithValue }) => {
    try {
      const docRef = await addDoc(collection(db, 'userChangeRequests'), {
        ...requestData,
        status: 'pending',
        createdAt: serverTimestamp(),
      })

      const newRequest = { id: docRef.id, ...requestData, status: 'pending' }

      // Send notification to superadmin
      const superadminId = await getSuperadminId()
      if (superadminId) {
        await notifyRoleRequestSubmitted(newRequest, superadminId)
      }

      return newRequest
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Approve a change request (for superadmin)
export const approveUserChangeRequest = createAsyncThunk(
  'userChangeRequests/approve',
  async ({ requestId, approvedBy }, { rejectWithValue }) => {
    try {
      const requestRef = doc(db, 'userChangeRequests', requestId)
      await updateDoc(requestRef, {
        status: 'approved',
        approvedBy,
        approvedAt: serverTimestamp(),
      })
      return { id: requestId, status: 'approved', approvedBy }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Reject a change request (for superadmin)
export const rejectUserChangeRequest = createAsyncThunk(
  'userChangeRequests/reject',
  async ({ requestId, rejectedBy, reason }, { rejectWithValue }) => {
    try {
      const requestRef = doc(db, 'userChangeRequests', requestId)
      await updateDoc(requestRef, {
        status: 'rejected',
        rejectedBy,
        rejectedAt: serverTimestamp(),
        rejectionReason: reason,
      })
      return { id: requestId, status: 'rejected', rejectedBy, rejectionReason: reason }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Delete a change request
export const deleteUserChangeRequest = createAsyncThunk(
  'userChangeRequests/delete',
  async (requestId, { rejectWithValue }) => {
    try {
      await deleteDoc(doc(db, 'userChangeRequests', requestId))
      return requestId
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const userChangeRequestsSlice = createSlice({
  name: 'userChangeRequests',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch requests
      .addCase(fetchUserChangeRequests.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserChangeRequests.fulfilled, (state, action) => {
        state.loading = false
        userChangeRequestsAdapter.setAll(state, action.payload)
      })
      .addCase(fetchUserChangeRequests.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Create request
      .addCase(createUserChangeRequest.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createUserChangeRequest.fulfilled, (state, action) => {
        state.loading = false
        userChangeRequestsAdapter.addOne(state, action.payload)
      })
      .addCase(createUserChangeRequest.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Approve request
      .addCase(approveUserChangeRequest.fulfilled, (state, action) => {
        userChangeRequestsAdapter.updateOne(state, {
          id: action.payload.id,
          changes: action.payload,
        })
      })
      // Reject request
      .addCase(rejectUserChangeRequest.fulfilled, (state, action) => {
        userChangeRequestsAdapter.updateOne(state, {
          id: action.payload.id,
          changes: action.payload,
        })
      })
      // Delete request
      .addCase(deleteUserChangeRequest.fulfilled, (state, action) => {
        userChangeRequestsAdapter.removeOne(state, action.payload)
      })
  },
})

export const {
  selectAll: selectAllUserChangeRequests,
  selectById: selectUserChangeRequestById,
} = userChangeRequestsAdapter.getSelectors((state) => state.userChangeRequests)

export default userChangeRequestsSlice.reducer
