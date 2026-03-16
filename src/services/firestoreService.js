import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore'
import { db } from '../config/firebase'

// Generic CRUD operations for Firestore
export const firestoreService = {
  // Create document
  create: async (collectionName, data) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date().toISOString()
      })
      return { success: true, id: docRef.id }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Read all documents
  getAll: async (collectionName) => {
    try {
      const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const data = []
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() })
      })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Update document
  update: async (collectionName, id, data) => {
    try {
      // Remove any undefined or null values and non-plain objects
      const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && typeof value !== 'function') {
          acc[key] = value
        }
        return acc
      }, {})

      const docRef = doc(db, collectionName, id)
      await updateDoc(docRef, {
        ...cleanData,
        updatedAt: new Date().toISOString()
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Delete document
  delete: async (collectionName, id) => {
    try {
      await deleteDoc(doc(db, collectionName, id))
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Get app settings document
  getSettings: async () => {
    try {
      const docRef = doc(db, 'settings', 'app-settings')
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return { success: true, data: docSnap.data() }
      }
      return { success: true, data: null }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Update app settings document (merge)
  updateSettings: async (data) => {
    try {
      const docRef = doc(db, 'settings', 'app-settings')
      await setDoc(docRef, data, { merge: true })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Real-time listener
  listen: (collectionName, callback) => {
    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (querySnapshot) => {
      const data = []
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() })
      })
      callback(data)
    }, (error) => {
      console.error(`Firestore listener error (${collectionName}):`, error)
    })
  },

  // Link a patient to a user (atomic batch write)
  linkPatientToUser: async (userId, patientId) => {
    try {
      const batch = writeBatch(db)
      batch.update(doc(db, 'users', userId), { linkedPatients: arrayUnion(patientId) })
      batch.update(doc(db, 'patients', patientId), { linkedUserId: userId })
      await batch.commit()
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Unlink a patient from a user (atomic batch write)
  unlinkPatientFromUser: async (userId, patientId) => {
    try {
      const batch = writeBatch(db)
      batch.update(doc(db, 'users', userId), { linkedPatients: arrayRemove(patientId) })
      batch.update(doc(db, 'patients', patientId), { linkedUserId: '' })
      await batch.commit()
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Bulk link patients to a user (atomic batch write)
  bulkLinkPatients: async (userId, patientIds) => {
    try {
      const batch = writeBatch(db)
      batch.update(doc(db, 'users', userId), { linkedPatients: arrayUnion(...patientIds) })
      patientIds.forEach(pid => {
        batch.update(doc(db, 'patients', pid), { linkedUserId: userId })
      })
      await batch.commit()
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // --- Appointments ---

  // Get appointments by userId (for users viewing their own)
  getAppointmentsByUser: async (userId) => {
    try {
      const q = query(collection(db, 'appointments'), where('userId', '==', userId), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      return { success: true, data: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Get pending appointments (for admins)
  getPendingAppointments: async () => {
    try {
      const q = query(collection(db, 'appointments'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      return { success: true, data: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Create appointment
  createAppointment: async (data) => {
    try {
      const docRef = await addDoc(collection(db, 'appointments'), { ...data, createdAt: Date.now() })
      return { success: true, id: docRef.id }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Approve appointment — trim to { userId, checkupId, status }
  approveAppointment: async (appointmentId, checkupId) => {
    try {
      const ref = doc(db, 'appointments', appointmentId)
      const snap = await getDoc(ref)
      if (!snap.exists()) return { success: false, error: 'Appointment not found' }
      const userId = snap.data().userId
      await setDoc(ref, { userId, checkupId, status: 'approved' })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Reject appointment — trim to { userId, status, rejectionReason }
  rejectAppointment: async (appointmentId, reason) => {
    try {
      const ref = doc(db, 'appointments', appointmentId)
      const snap = await getDoc(ref)
      if (!snap.exists()) return { success: false, error: 'Appointment not found' }
      const userId = snap.data().userId
      await setDoc(ref, { userId, status: 'rejected', rejectionReason: reason || '' })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Delete appointment (user can delete their own pending ones)
  deleteAppointment: async (appointmentId) => {
    try {
      await deleteDoc(doc(db, 'appointments', appointmentId))
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Update appointment (user can edit their own pending ones)
  updateAppointment: async (appointmentId, data) => {
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), data)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },
}
