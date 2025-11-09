import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Activity Service for tracking user actions in real-time
 * Stores all user activities in Firestore for analytics and auditing
 */

// Activity Types
export const ACTIVITY_TYPES = {
  // Authentication
  LOGIN: 'login',
  LOGOUT: 'logout',

  // Patients
  PATIENT_CREATE: 'patient_create',
  PATIENT_UPDATE: 'patient_update',
  PATIENT_DELETE: 'patient_delete',
  PATIENT_VIEW: 'patient_view',

  // Checkups
  CHECKUP_CREATE: 'checkup_create',
  CHECKUP_UPDATE: 'checkup_update',
  CHECKUP_DELETE: 'checkup_delete',
  CHECKUP_VIEW: 'checkup_view',
  CHECKUP_PDF_GENERATE: 'checkup_pdf_generate',

  // Tests
  TEST_CREATE: 'test_create',
  TEST_UPDATE: 'test_update',
  TEST_DELETE: 'test_delete',
  TEST_VIEW: 'test_view',

  // Medicines
  MEDICINE_CREATE: 'medicine_create',
  MEDICINE_UPDATE: 'medicine_update',
  MEDICINE_DELETE: 'medicine_delete',
  MEDICINE_VIEW: 'medicine_view',

  // Users
  USER_CREATE: 'user_create',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  USER_REQUEST_CREATE: 'user_request_create',
  USER_REQUEST_APPROVE: 'user_request_approve',
  USER_REQUEST_REJECT: 'user_request_reject',
  USER_PASSWORD_RESET: 'user_password_reset',
}

/**
 * Log user activity to Firestore
 * @param {Object} activityData - Activity details
 * @param {string} activityData.userId - User ID who performed the action
 * @param {string} activityData.username - Username who performed the action
 * @param {string} activityData.userRole - Role of the user
 * @param {string} activityData.activityType - Type of activity (from ACTIVITY_TYPES)
 * @param {string} activityData.description - Human-readable description
 * @param {Object} activityData.metadata - Additional data (optional)
 */
export const logActivity = async (activityData) => {
  try {
    const activity = {
      userId: activityData.userId,
      username: activityData.username,
      userRole: activityData.userRole,
      activityType: activityData.activityType,
      description: activityData.description,
      metadata: activityData.metadata || {},
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
    }

    await addDoc(collection(db, 'userActivities'), activity)
    return { success: true }
  } catch (error) {
    console.error('Error logging activity:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get user activities with filters
 * @param {Object} filters - Query filters
 * @param {string} filters.userId - Filter by user ID (optional)
 * @param {string} filters.activityType - Filter by activity type (optional)
 * @param {number|string} filters.days - Number of days to fetch, or 'all' for all history (default: 'all')
 * @param {number} filters.limit - Limit results (optional)
 */
export const getUserActivities = async (filters = {}) => {
  try {
    const {
      userId = null,
      activityType = null,
      days = 'all',
      limit = null
    } = filters

    // Build query
    let q

    // If days is 'all', fetch all activities without date filter
    if (days === 'all') {
      q = query(
        collection(db, 'userActivities'),
        orderBy('timestamp', 'desc')
      )

      if (userId) {
        q = query(
          collection(db, 'userActivities'),
          where('userId', '==', userId),
          orderBy('timestamp', 'desc')
        )
      }

      if (activityType) {
        q = query(
          collection(db, 'userActivities'),
          where('activityType', '==', activityType),
          orderBy('timestamp', 'desc')
        )
      }
    } else {
      // Calculate date range for specific days
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      const startTimestamp = Timestamp.fromDate(startDate)

      q = query(
        collection(db, 'userActivities'),
        where('timestamp', '>=', startTimestamp),
        orderBy('timestamp', 'desc')
      )

      if (userId) {
        q = query(
          collection(db, 'userActivities'),
          where('userId', '==', userId),
          where('timestamp', '>=', startTimestamp),
          orderBy('timestamp', 'desc')
        )
      }

      if (activityType) {
        q = query(
          collection(db, 'userActivities'),
          where('activityType', '==', activityType),
          where('timestamp', '>=', startTimestamp),
          orderBy('timestamp', 'desc')
        )
      }
    }

    const querySnapshot = await getDocs(q)
    const activities = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    }))

    return {
      success: true,
      data: limit ? activities.slice(0, limit) : activities
    }
  } catch (error) {
    console.error('Error fetching activities:', error)
    return { success: false, error: error.message, data: [] }
  }
}

/**
 * Get activity statistics for dashboard
 * @param {number|string} days - Number of days to analyze, or 'all' for all history
 */
export const getActivityStats = async (days = 'all') => {
  try {
    const result = await getUserActivities({ days })
    if (!result.success) return result

    const activities = result.data

    // Group by user
    const userStats = {}
    const dailyStats = {}
    const typeStats = {}

    activities.forEach(activity => {
      // User stats
      if (!userStats[activity.userId]) {
        userStats[activity.userId] = {
          userId: activity.userId,
          username: activity.username,
          userRole: activity.userRole,
          totalActivities: 0,
          activities: {}
        }
      }
      userStats[activity.userId].totalActivities++

      // Activity type count per user
      if (!userStats[activity.userId].activities[activity.activityType]) {
        userStats[activity.userId].activities[activity.activityType] = 0
      }
      userStats[activity.userId].activities[activity.activityType]++

      // Daily stats
      const dateKey = activity.timestamp.toISOString().split('T')[0]
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = {}
      }
      if (!dailyStats[dateKey][activity.userId]) {
        dailyStats[dateKey][activity.userId] = 0
      }
      dailyStats[dateKey][activity.userId]++

      // Activity type stats
      if (!typeStats[activity.activityType]) {
        typeStats[activity.activityType] = 0
      }
      typeStats[activity.activityType]++
    })

    return {
      success: true,
      data: {
        userStats: Object.values(userStats),
        dailyStats,
        typeStats,
        totalActivities: activities.length,
        dateRange: { days }
      }
    }
  } catch (error) {
    console.error('Error calculating activity stats:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Helper function to create activity description
 * @param {string} activityType - Type of activity
 * @param {Object} metadata - Additional context
 */
export const createActivityDescription = (activityType, metadata = {}) => {
  const descriptions = {
    // Auth
    login: 'Logged in',
    logout: 'Logged out',

    // Patients
    patient_create: `Created patient: ${metadata.patientName || 'Unknown'}`,
    patient_update: `Updated patient: ${metadata.patientName || 'Unknown'}`,
    patient_delete: `Deleted patient: ${metadata.patientName || 'Unknown'}`,
    patient_view: `Viewed patient: ${metadata.patientName || 'Unknown'}`,

    // Checkups
    checkup_create: `Created checkup for patient: ${metadata.patientName || 'Unknown'}`,
    checkup_update: `Updated checkup: ${metadata.checkupId || 'Unknown'}`,
    checkup_delete: `Deleted checkup: ${metadata.checkupId || 'Unknown'}`,
    checkup_view: `Viewed checkup: ${metadata.checkupId || 'Unknown'}`,
    checkup_pdf_generate: `Generated PDF for checkup: ${metadata.checkupId || 'Unknown'}`,

    // Tests
    test_create: `Created test: ${metadata.testName || 'Unknown'}`,
    test_update: `Updated test: ${metadata.testName || 'Unknown'}`,
    test_delete: `Deleted test: ${metadata.testName || 'Unknown'}`,
    test_view: `Viewed test: ${metadata.testName || 'Unknown'}`,

    // Medicines
    medicine_create: `Created medicine: ${metadata.medicineName || 'Unknown'}`,
    medicine_update: `Updated medicine: ${metadata.medicineName || 'Unknown'}`,
    medicine_delete: `Deleted medicine: ${metadata.medicineName || 'Unknown'}`,
    medicine_view: `Viewed medicine: ${metadata.medicineName || 'Unknown'}`,

    // Users
    user_create: `Created user: ${metadata.username || 'Unknown'}`,
    user_update: `Updated user: ${metadata.username || 'Unknown'}`,
    user_delete: `Deleted user: ${metadata.username || 'Unknown'}`,
    user_request_create: `Requested new user: ${metadata.username || 'Unknown'}`,
    user_request_approve: `Approved user request: ${metadata.username || 'Unknown'}`,
    user_request_reject: `Rejected user request: ${metadata.username || 'Unknown'}`,
    user_password_reset: `Reset password for: ${metadata.username || 'Unknown'}`,
  }

  return descriptions[activityType] || `Performed action: ${activityType}`
}

export default {
  logActivity,
  getUserActivities,
  getActivityStats,
  createActivityDescription,
  ACTIVITY_TYPES,
}
