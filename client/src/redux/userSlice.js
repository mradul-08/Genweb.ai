import { createSlice } from "@reduxjs/toolkit"

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: null,
    authChecked: false,   // ← NEW: prevents redirect before auth is verified
  },
  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload
      state.authChecked = true  // ← mark auth as checked whenever we set user
    },
    setAuthChecked: (state) => {
      state.authChecked = true
    }
  }
})

export const { setUserData, setAuthChecked } = userSlice.actions
export default userSlice.reducer
