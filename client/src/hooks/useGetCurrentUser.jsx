import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setUserData, setAuthChecked } from '../redux/userSlice'

function useGetCurrentUser() {
  const dispatch = useDispatch()

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
       const result = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/current`, {
          withCredentials: true
        })
        dispatch(setUserData(result.data.user))  // sets authChecked = true
      } catch (error) {
        dispatch(setAuthChecked())  // auth failed but checked = true, don't loop
      }
    }
    getCurrentUser()
  }, [])
}

export default useGetCurrentUser
