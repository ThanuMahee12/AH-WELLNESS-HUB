import { collection, addDoc, query, where, onSnapshot, updateDoc, doc, orderBy, serverTimestamp, getDocs, arrayUnion } from 'firebase/firestore'
import { db } from '../config/firebase'

const COLLECTION = 'notifications'

export const NOTIFICATION_TYPES = {
  ROLE_REQUEST_SUBMITTED: 'role_request_submitted',
  ROLE_REQUEST_APPROVED: 'role_request_approved',
  ROLE_REQUEST_REJECTED: 'role_request_rejected',
  SYSTEM_RELEASE: 'system_release',
  APPOINTMENT_CREATED: 'appointment_created',
  APPOINTMENT_APPROVED: 'appointment_approved',
  APPOINTMENT_REJECTED: 'appointment_rejected',
}

/**
 * Create a new notification
 * @param {Object} notificationData - The notification data
 * @returns {Promise<Object>} - Success/error result
 */
export const createNotification = async (notificationData, notifSettings = null) => {
  try {
    // Check if this notification type is enabled in settings
    if (notifSettings && notificationData.type) {
      const typeConfig = notifSettings[notificationData.type]
      if (typeConfig && typeConfig.enabled === false) {
        return { success: true, skipped: true, message: 'Notification type is disabled' }
      }
    }

    const notification = {
      ...notificationData,
      read: false,
      createdAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, COLLECTION), notification)

    return {
      success: true,
      id: docRef.id,
      message: 'Notification created successfully'
    }
  } catch (error) {
    console.error('Error creating notification:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Subscribe to real-time notifications for a specific user
 * @param {string} userId - The user ID to listen for
 * @param {Function} callback - Callback function to handle new notifications
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToNotifications = (userId, callback) => {
  try {
    // User-specific notifications
    const userQuery = query(
      collection(db, COLLECTION),
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc')
    )

    // System-wide notifications (recipientId: 'all')
    const systemQuery = query(
      collection(db, COLLECTION),
      where('recipientId', '==', 'all'),
      orderBy('createdAt', 'desc')
    )

    let userNotifications = []
    let systemNotifications = []

    const mergeAndCallback = () => {
      // For system notifications, treat as unread if user hasn't read it
      // Filter out notifications dismissed by this user
      const mappedSystem = systemNotifications
        .filter(n => !Array.isArray(n.dismissedBy) || !n.dismissedBy.includes(userId))
        .map(n => ({
          ...n,
          read: Array.isArray(n.readBy) && n.readBy.includes(userId),
          isSystem: true,
        }))
      const merged = [...userNotifications, ...mappedSystem]
        .sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0
          const timeB = b.createdAt?.toMillis?.() || 0
          return timeB - timeA
        })
      callback(merged)
    }

    const unsubUser = onSnapshot(userQuery, (snapshot) => {
      userNotifications = []
      snapshot.forEach((doc) => {
        userNotifications.push({ id: doc.id, ...doc.data() })
      })
      mergeAndCallback()
    }, (error) => {
      console.error('Error in user notifications listener:', error)
    })

    const unsubSystem = onSnapshot(systemQuery, (snapshot) => {
      systemNotifications = []
      snapshot.forEach((doc) => {
        systemNotifications.push({ id: doc.id, ...doc.data() })
      })
      mergeAndCallback()
    }, (error) => {
      console.error('Error in system notifications listener:', error)
    })

    return () => { unsubUser(); unsubSystem() }
  } catch (error) {
    console.error('Error subscribing to notifications:', error)
    return () => {}
  }
}

/**
 * Mark a notification as read
 * @param {string} notificationId - The notification ID
 * @returns {Promise<Object>} - Success/error result
 */
export const markAsRead = async (notificationId, userId = null) => {
  try {
    const notificationRef = doc(db, COLLECTION, notificationId)
    if (userId) {
      // System notification — add userId to readBy array
      await updateDoc(notificationRef, {
        readBy: arrayUnion(userId)
      })
    } else {
      // User-specific notification
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      })
    }

    return {
      success: true,
      message: 'Notification marked as read'
    }
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Mark all notifications as read for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} - Success/error result
 */
export const markAllAsRead = async (userId) => {
  try {
    // Mark user-specific notifications
    const userQ = query(
      collection(db, COLLECTION),
      where('recipientId', '==', userId),
      where('read', '==', false)
    )
    const userSnap = await getDocs(userQ)
    const promises = []
    userSnap.forEach((document) => {
      promises.push(updateDoc(doc(db, COLLECTION, document.id), {
        read: true,
        readAt: serverTimestamp()
      }))
    })

    // Mark system notifications as read for this user
    const sysQ = query(
      collection(db, COLLECTION),
      where('recipientId', '==', 'all')
    )
    const sysSnap = await getDocs(sysQ)
    sysSnap.forEach((document) => {
      const data = document.data()
      if (!Array.isArray(data.readBy) || !data.readBy.includes(userId)) {
        promises.push(updateDoc(doc(db, COLLECTION, document.id), {
          readBy: arrayUnion(userId)
        }))
      }
    })

    await Promise.all(promises)

    return {
      success: true,
      message: 'All notifications marked as read'
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Create notification for role request submission (to superadmin)
 * @param {Object} requestData - The role request data
 * @param {string} superadminId - The superadmin user ID
 * @returns {Promise<Object>} - Success/error result
 */
export const notifyRoleRequestSubmitted = async (requestData, superadminId) => {
  return await createNotification({
    type: NOTIFICATION_TYPES.ROLE_REQUEST_SUBMITTED,
    recipientId: superadminId,
    title: 'New Role Change Request',
    message: `${requestData.username} has requested to change role from ${requestData.currentRole} to ${requestData.requestedRole}`,
    metadata: {
      requestId: requestData.id,
      userId: requestData.userId,
      username: requestData.username,
      currentRole: requestData.currentRole,
      requestedRole: requestData.requestedRole,
    }
  })
}

/**
 * Create notification for role request approval (to requester)
 * @param {Object} requestData - The role request data
 * @param {string} generatedPassword - The generated password (if applicable)
 * @returns {Promise<Object>} - Success/error result
 */
export const notifyRoleRequestApproved = async (requestData, generatedPassword = null) => {
  const message = generatedPassword
    ? `Your role change request has been approved! Your role has been changed to ${requestData.requestedRole}. Your new password is: ${generatedPassword}`
    : `Your role change request has been approved! Your role has been changed to ${requestData.requestedRole}.`

  return await createNotification({
    type: NOTIFICATION_TYPES.ROLE_REQUEST_APPROVED,
    recipientId: requestData.userId,
    title: 'Role Request Approved',
    message: message,
    metadata: {
      requestId: requestData.id,
      newRole: requestData.requestedRole,
      processedBy: requestData.processedBy,
      generatedPassword: generatedPassword,
    }
  })
}

/**
 * Create notification for role request rejection (to requester)
 * @param {Object} requestData - The role request data
 * @param {string} reason - The rejection reason (optional)
 * @returns {Promise<Object>} - Success/error result
 */
export const notifyRoleRequestRejected = async (requestData, reason = null) => {
  const message = reason
    ? `Your role change request has been rejected. Reason: ${reason}`
    : `Your role change request from ${requestData.currentRole} to ${requestData.requestedRole} has been rejected.`

  return await createNotification({
    type: NOTIFICATION_TYPES.ROLE_REQUEST_REJECTED,
    recipientId: requestData.userId,
    title: 'Role Request Rejected',
    message: message,
    metadata: {
      requestId: requestData.id,
      processedBy: requestData.processedBy,
      reason: reason,
    }
  })
}

/**
 * Create a system-wide release notification visible to all users
 * @param {string} version - The new version string
 * @returns {Promise<Object>} - Success/error result
 */
export const notifySystemRelease = async (version) => {
  try {
    const notification = {
      type: NOTIFICATION_TYPES.SYSTEM_RELEASE,
      recipientId: 'all',
      title: 'New Release Available',
      message: `Version ${version} has been published. Please refresh your browser to get the latest updates.`,
      read: false,
      readBy: [],
      createdAt: serverTimestamp(),
      metadata: { version },
    }
    const docRef = await addDoc(collection(db, COLLECTION), notification)
    return { success: true, id: docRef.id }
  } catch (error) {
    console.error('Error creating system release notification:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Notify editors/admins about a new appointment request
 * Sends to 'all' so any editor+ will see it
 */
export const notifyAppointmentCreated = async ({ username, patientName, expectedDate, tests }) => {
  return await createNotification({
    type: NOTIFICATION_TYPES.APPOINTMENT_CREATED,
    recipientId: 'all',
    title: 'New Appointment Request',
    message: `${username} requested an appointment for ${patientName} on ${expectedDate}. Tests: ${Array.isArray(tests) ? tests.join(', ') : tests}`,
    metadata: { username, patientName, expectedDate },
  })
}

/**
 * Notify user that their appointment was approved
 */
export const notifyAppointmentApproved = async ({ userId, expectedDate, checkupId }) => {
  return await createNotification({
    type: NOTIFICATION_TYPES.APPOINTMENT_APPROVED,
    recipientId: userId,
    title: 'Appointment Approved',
    message: `Your appointment for ${expectedDate} has been approved. Your checkup is ready.`,
    metadata: { checkupId, expectedDate },
  })
}

/**
 * Notify user that their appointment was rejected
 */
export const notifyAppointmentRejected = async ({ userId, expectedDate, reason }) => {
  return await createNotification({
    type: NOTIFICATION_TYPES.APPOINTMENT_REJECTED,
    recipientId: userId,
    title: 'Appointment Rejected',
    message: reason
      ? `Your appointment for ${expectedDate} was rejected. Reason: ${reason}`
      : `Your appointment for ${expectedDate} was rejected.`,
    metadata: { expectedDate, reason },
  })
}
