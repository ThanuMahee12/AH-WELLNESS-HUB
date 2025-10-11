import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  patients: [],
  nextId: 1,
}

const patientsSlice = createSlice({
  name: 'patients',
  initialState,
  reducers: {
    addPatient: (state, action) => {
      state.patients.push({ ...action.payload, id: state.nextId })
      state.nextId += 1
    },
    updatePatient: (state, action) => {
      const index = state.patients.findIndex(p => p.id === action.payload.id)
      if (index !== -1) {
        state.patients[index] = action.payload
      }
    },
    deletePatient: (state, action) => {
      state.patients = state.patients.filter(p => p.id !== action.payload)
    },
  },
})

export const { addPatient, updatePatient, deletePatient } = patientsSlice.actions
export default patientsSlice.reducer
