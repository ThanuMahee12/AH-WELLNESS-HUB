import { collection, addDoc, query, where, onSnapshot, updateDoc, doc, orderBy, serverTimestamp, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'

const COLLECTION = 'notifications'

export const NOTIFICATION_TYPES = {
  ROLE_REQUEST_SUBMITTED: 'role_request_submitted',
  ROLE_REQUEST_APPROVED: 'role_request_approved',
  ROLE_REQUEST_REJECTED: 'role_request_rejected',
}

/**
 * Create a new notification
 * @param {Object} notificationData - The notification data
 * @returns {Promise<Object>} - Success/error result
 */
export const createNotification = async (notificationData) => {
  try {
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
    const q = query(
      collection(db, COLLECTION),
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = []
      snapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data()
        })
      })
      callback(notifications)
    }, (error) => {
      console.error('Error in notifications listener:', error)
    })

    return unsubscribe
  } catch (error) {
    console.error('Error subscribing to notifications:', error)
    return () => {} // Return empty function if subscription fails
  }
}

/**
 * Mark a notification as read
 * @param {string} notificationId - The notification ID
 * @returns {Promise<Object>} - Success/error result
 */
export const markAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, COLLECTION, notificationId)
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp()
    })

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
    const q = query(
      collection(db, COLLECTION),
      where('recipientId', '==', userId),
      where('read', '==', false)
    )

    const snapshot = await getDocs(q)
    const updatePromises = []

    snapshot.forEach((document) => {
      const notificationRef = doc(db, COLLECTION, document.id)
      updatePromises.push(updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      }))
    })

    await Promise.all(updatePromises)

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
