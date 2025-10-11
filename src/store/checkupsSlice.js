import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  checkups: [],
  nextId: 1,
}

const checkupsSlice = createSlice({
  name: 'checkups',
  initialState,
  reducers: {
    addCheckup: (state, action) => {
      state.checkups.push({
        ...action.payload,
        id: state.nextId,
        timestamp: new Date().toISOString()
      })
      state.nextId += 1
    },
    updateCheckup: (state, action) => {
      const index = state.checkups.findIndex(c => c.id === action.payload.id)
      if (index !== -1) {
        state.checkups[index] = action.payload
      }
    },
    deleteCheckup: (state, action) => {
      state.checkups = state.checkups.filter(c => c.id !== action.payload)
    },
  },
})

export const { addCheckup, updateCheckup, deleteCheckup } = checkupsSlice.actions
export default checkupsSlice.reducer
