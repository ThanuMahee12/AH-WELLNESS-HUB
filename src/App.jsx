import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setUser } from './store/authSlice'
import { authService } from './services/authService'
import { NotificationProvider } from './context'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingSpinner from './components/common/LoadingSpinner'

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Patients = lazy(() => import('./pages/Patients'))
const PatientDetail = lazy(() => import('./pages/PatientDetail'))
const Checkups = lazy(() => import('./pages/Checkups'))
const CheckupDetail = lazy(() => import('./pages/CheckupDetail'))
const Tests = lazy(() => import('./pages/Tests'))
const Medicines = lazy(() => import('./pages/Medicines'))
const Users = lazy(() => import('./pages/UsersEnhanced'))
const UserRequests = lazy(() => import('./pages/UserRequests'))
const UserActivity = lazy(() => import('./pages/UserActivity'))
const AdminSetup = lazy(() => import('./pages/AdminSetup'))

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
    <NotificationProvider>
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
            <Suspense fallback={<LoadingSpinner text="Loading page..." />}>
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
                  path="/patients/:id"
                  element={
                    <ProtectedRoute>
                      <PatientDetail />
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
                  path="/checkups/:id"
                  element={
                    <ProtectedRoute>
                      <CheckupDetail />
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
                  path="/medicines"
                  element={
                    <ProtectedRoute>
                      <Medicines />
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
                <Route
                  path="/user-requests"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <UserRequests />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/user-activity"
                  element={
                    <ProtectedRoute roles={['superadmin']}>
                      <UserActivity />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin-setup"
                  element={
                    <ProtectedRoute>
                      <AdminSetup />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </div>
        </div>
      </div>
    </NotificationProvider>
  )
}

export default App
