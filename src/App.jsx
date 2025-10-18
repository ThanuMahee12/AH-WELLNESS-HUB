import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setUser } from './store/authSlice'
import { authService } from './services/authService'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import Checkups from './pages/Checkups'
import Tests from './pages/Tests'
import Users from './pages/Users'

function App() {
  const dispatch = useDispatch()
  const location = useLocation()
  const { isAuthenticated } = useSelector(state => state.auth)

  // Pages that shouldn't show sidebar
  const noSidebarPages = ['/', '/login']
  const showSidebar = isAuthenticated && !noSidebarPages.includes(location.pathname)

  // Pages that shouldn't show navbar
  const noNavbarPages = ['/']
  const showNavbar = !noNavbarPages.includes(location.pathname)

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = authService.onAuthStateChange((user) => {
      dispatch(setUser(user))
    })

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [dispatch])

  return (
    <div className="d-flex flex-column min-vh-100" style={{ overflow: 'hidden', width: '100%' }}>
      {showNavbar && <Navbar />}
      <div className="d-flex flex-grow-1" style={{ marginTop: showNavbar ? '60px' : '0', overflow: 'hidden', width: '100%' }}>
        {showSidebar && <Sidebar />}
        <div
          className="flex-grow-1"
          style={{
            marginLeft: 0,
            paddingLeft: showSidebar ? '250px' : '0',
            width: '100%',
            maxWidth: '100vw',
            overflow: 'auto'
          }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients"
              element={
                <ProtectedRoute>
                  <Patients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkups"
              element={
                <ProtectedRoute>
                  <Checkups />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tests"
              element={
                <ProtectedRoute>
                  <Tests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Users />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default App
