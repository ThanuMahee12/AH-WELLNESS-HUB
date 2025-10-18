import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  onSnapshot
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
      console.log('Firestore Update:', { collectionName, id, data })

      // Remove any undefined or null values and non-plain objects
      const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && typeof value !== 'function') {
          acc[key] = value
        }
        return acc
      }, {})

      console.log('Clean data:', cleanData)

      const docRef = doc(db, collectionName, id)
      await updateDoc(docRef, {
        ...cleanData,
        updatedAt: new Date().toISOString()
      })
      return { success: true }
    } catch (error) {
      console.error('Firestore update error:', error)
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

  // Real-time listener
  listen: (collectionName, callback) => {
    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (querySnapshot) => {
      const data = []
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() })
      })
      callback(data)
    })
  }
}
