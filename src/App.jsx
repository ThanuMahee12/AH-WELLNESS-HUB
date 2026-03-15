import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setUser, logoutUser } from './store/authSlice'
import { fetchSettings } from './store/settingsSlice'
import { authService } from './services/authService'
import { sessionTimeoutService } from './services/sessionTimeoutService'
import { NotificationProvider, useNotification } from './context'
import { logError } from './services/errorLogService'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingSpinner from './components/common/LoadingSpinner'

// Retry dynamic imports once on failure (handles stale cache after deploy)
const lazyRetry = (importFn) => lazy(() =>
  importFn().catch(() => {
    // If chunk fails to load (stale cache after deploy), reload the page once
    const reloaded = sessionStorage.getItem('chunk-reload')
    if (!reloaded) {
      sessionStorage.setItem('chunk-reload', '1')
      window.location.reload()
      return new Promise(() => {}) // never resolves — page is reloading
    }
    sessionStorage.removeItem('chunk-reload')
    return importFn() // second attempt — let it fail naturally if still broken
  })
)

// Clear reload flag on successful page load
sessionStorage.removeItem('chunk-reload')

// Lazy load pages for better performance
const Home = lazyRetry(() => import('./pages/Home'))
const Login = lazyRetry(() => import('./pages/Login'))
const Dashboard = lazyRetry(() => import('./pages/Dashboard'))
const Patients = lazyRetry(() => import('./pages/Patients'))
const PatientDetail = lazyRetry(() => import('./pages/PatientDetail'))
const Checkups = lazyRetry(() => import('./pages/Checkups'))
const CheckupDetail = lazyRetry(() => import('./pages/CheckupDetail'))
const CheckupForm = lazyRetry(() => import('./pages/CheckupForm'))
const Tests = lazyRetry(() => import('./pages/Tests'))
const TestDetail = lazyRetry(() => import('./pages/TestDetail'))
const Medicines = lazyRetry(() => import('./pages/Medicines'))
const MedicineDetail = lazyRetry(() => import('./pages/MedicineDetail'))
const UserManagement = lazyRetry(() => import('./pages/UserManagement'))
const UserDetail = lazyRetry(() => import('./pages/UserDetail'))
const AdminSetup = lazyRetry(() => import('./pages/AdminSetup'))
const Settings = lazyRetry(() => import('./pages/Settings'))
const Notifications = lazyRetry(() => import('./pages/Notifications'))
const SystemMaintenance = lazyRetry(() => import('./pages/SystemMaintenance'))

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

  // Global error handlers — capture unhandled errors to RTDB
  useEffect(() => {
    const handleError = (event) => {
      logError({
        message: event.message || String(event.error),
        stack: event.error?.stack || '',
        source: 'window.onerror',
        url: window.location.pathname,
        userId: user?.uid || '',
        username: user?.username || user?.email || '',
        userRole: user?.role || '',
      })
    }

    const handleUnhandledRejection = (event) => {
      const reason = event.reason
      logError({
        message: reason?.message || String(reason),
        stack: reason?.stack || '',
        source: 'unhandledrejection',
        userId: user?.uid || '',
        username: user?.username || user?.email || '',
        userRole: user?.role || '',
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [user])

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
      <div className="d-flex flex-grow-1" style={{ marginTop: showNavbar ? '52px' : '0', overflow: 'hidden', width: '100%' }}>
        {showSidebar && <Sidebar />}
        <div
          className={`flex-grow-1 main-content${showSidebar ? '' : ' no-sidebar'}`}
        >
          <ErrorBoundary user={user}>
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
                path="/maintenance"
                element={
                  <ProtectedRoute roles={['superadmin']}>
                    <SystemMaintenance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
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
          </ErrorBoundary>
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
