import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useSelector } from 'react-redux'
import Home from './pages/Home'
import Login from './components/LoginModels'
import Dashboard from './pages/Dashboard'
import Generate from './pages/Generate'
import Editor from './pages/Editor'
import Pricing from './pages/Pricing'
import useGetCurrentUser from './hooks/useGetCurrentUser.jsx'

export const serverUrl = import.meta.env.VITE_API_URL || ''

// Protected route — redirects to /login if not logged in
function Protected({ children }) {
  const { userData, authChecked } = useSelector(s => s.user)

  // Don't redirect until we've checked auth
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

// Public route — redirects to /dashboard if already logged in
function PublicOnly({ children }) {
  const { userData, authChecked } = useSelector(s => s.user)
  if (!authChecked) return null  // wait silently
  if (userData) return <Navigate to="/dashboard" replace />
  return children
}

function AppContent() {
  useGetCurrentUser()
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
