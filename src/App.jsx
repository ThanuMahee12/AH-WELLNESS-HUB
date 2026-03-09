import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setUser, logoutUser } from './store/authSlice'
import { fetchSettings } from './store/settingsSlice'
import { authService } from './services/authService'
import { sessionTimeoutService } from './services/sessionTimeoutService'
import { NotificationProvider, useNotification } from './context'
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
const CheckupForm = lazy(() => import('./pages/CheckupForm'))
const Tests = lazy(() => import('./pages/Tests'))
const TestDetail = lazy(() => import('./pages/TestDetail'))
const Medicines = lazy(() => import('./pages/Medicines'))
const MedicineDetail = lazy(() => import('./pages/MedicineDetail'))
const UserManagement = lazy(() => import('./pages/UserManagement'))
const UserDetail = lazy(() => import('./pages/UserDetail'))
const AdminSetup = lazy(() => import('./pages/AdminSetup'))
const Settings = lazy(() => import('./pages/Settings'))
const FieldSettingDetail = lazy(() => import('./pages/FieldSettingDetail'))
const ColumnSettingDetail = lazy(() => import('./pages/ColumnSettingDetail'))

// Create a wrapper component to access notification context
function AppContent() {
  const dispatch = useDispatch()
  const location = useLocation()
  const { isAuthenticated, user } = useSelector(state => state.auth)
  const { showNotification } = useNotification()

  // Pages that shouldn't show sidebar
  const noSidebarPages = ['/', '/login']
  const showSidebar = isAuthenticated && !noSidebarPages.includes(location.pathname)

  // Pages that shouldn't show navbar
  const noNavbarPages = []
  const showNavbar = !noNavbarPages.includes(location.pathname)

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = authService.onAuthStateChange((user) => {
      dispatch(setUser(user))
      if (user) {
        dispatch(fetchSettings())
      }
    })

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [dispatch])

  // Handle session timeout
  useEffect(() => {
    if (isAuthenticated && user) {
      // Start session timeout monitoring
      sessionTimeoutService.start(user.role, () => {
        // Show notification before logout
        showNotification('Session expired due to inactivity. Please login again.', 'warning')

        // Logout user after a short delay to show the notification
        setTimeout(() => {
          dispatch(logoutUser())
        }, 1000)
      })

      // Cleanup on logout or unmount
      return () => {
        sessionTimeoutService.stop()
      }
    } else {
      // Stop session timeout if user is not authenticated
      sessionTimeoutService.stop()
    }
  }, [isAuthenticated, user, dispatch, showNotification])

  return (
    <div className="d-flex flex-column min-vh-100" style={{ overflow: 'hidden', width: '100%' }}>
      {showNavbar && <Navbar />}
      <div className="d-flex flex-grow-1" style={{ marginTop: showNavbar ? '60px' : '0', overflow: 'hidden', width: '100%' }}>
        {showSidebar && <Sidebar />}
        <div
          className={`flex-grow-1 main-content${showSidebar ? '' : ' no-sidebar'}`}
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
                path="/checkups/new"
                element={
                  <ProtectedRoute>
                    <CheckupForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkups/:id"
                element={
                  <ProtectedRoute>
                    <CheckupForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkups/:id/details"
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
                path="/tests/:id"
                element={
                  <ProtectedRoute>
                    <TestDetail />
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
                path="/medicines/:id"
                element={
                  <ProtectedRoute>
                    <MedicineDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users/:id"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <UserDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute roles={['superadmin']}>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/forms/:entity/:fieldKey"
                element={
                  <ProtectedRoute roles={['superadmin']}>
                    <FieldSettingDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/tables/:entity/:columnKey"
                element={
                  <ProtectedRoute roles={['superadmin']}>
                    <ColumnSettingDetail />
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
  )
}

function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  )
}

export default App
