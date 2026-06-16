import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from 'react-redux'
import { getRedirectResult } from "firebase/auth"
import { auth } from "./firebase"
import Home from './pages/Home'
import Login from './components/LoginModels'
import Dashboard from './pages/Dashboard'
import Generate from './pages/Generate'
import Editor from './pages/Editor'
import Pricing from './pages/Pricing'
import useGetCurrentUser from './hooks/useGetCurrentUser.jsx'
import { setUserData } from './redux/userSlice'

export const serverUrl = import.meta.env.VITE_API_URL || ''

function Protected({ children }) {
  const { userData, authChecked } = useSelector(s => s.user)
  if (!authChecked) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#040408',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: 14,
        opacity: 0.5
      }}>
        Loading...
      </div>
    )
  }
  if (!userData) return <Navigate to="/login" replace />
  return children
}

function PublicOnly({ children }) {
  const { userData, authChecked } = useSelector(s => s.user)
  if (!authChecked) return null
  if (userData) return <Navigate to="/dashboard" replace />
  return children
}

function AppContent() {
  useGetCurrentUser()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  useEffect(() => {
  getRedirectResult(auth)
    .then(async (result) => {

      console.log("REDIRECT RESULT =", result)

      if (!result?.user) return

      const user = result.user

      console.log("GOOGLE USER =", user)

      try {
        const response = await fetch(`${serverUrl}/api/auth/google`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: user.displayName,
            email: user.email,
            avatar: user.photoURL,
          }),
        })

        console.log("BACKEND RESPONSE =", response.status)

      } catch (e) {
        console.error(e)
      }
    })
    .catch(console.error)
}, [])

  return (
    <Routes>
      <Route path="/"          element={<Home />} />
      <Route path="/pricing"   element={<Pricing />} />
      <Route path="/login"     element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/generate"  element={<Protected><Generate /></Protected>} />
      <Route path="/editor"    element={<Protected><Editor /></Protected>} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}