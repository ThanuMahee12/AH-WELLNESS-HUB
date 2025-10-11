import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  users: [
    { id: 1, username: 'admin', email: 'admin@bloodlab.com', password: 'admin123', mobile: '1234567890', role: 'admin' },
    { id: 2, username: 'user1', email: 'user@bloodlab.com', password: 'user123', mobile: '9876543210', role: 'user' },
  ],
  nextId: 3,
}

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    addUser: (state, action) => {
      state.users.push({ ...action.payload, id: state.nextId, role: 'user' })
      state.nextId += 1
    },
    updateUser: (state, action) => {
      const index = state.users.findIndex(u => u.id === action.payload.id)
      if (index !== -1) {
        state.users[index] = action.payload
      }
    },
    deleteUser: (state, action) => {
      state.users = state.users.filter(u => u.id !== action.payload)
    },
  },
})

export const { addUser, updateUser, deleteUser } = usersSlice.actions
export default usersSlice.reducer
