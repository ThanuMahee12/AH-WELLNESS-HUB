import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'

export const authService = {
  // Login user
  login: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))

      if (userDoc.exists()) {
        return {
          success: true,
          user: {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            ...userDoc.data()
          }
        }
      } else {
        return { success: false, error: 'User profile not found' }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Logout user
  logout: async () => {
    try {
      await signOut(auth)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Send password reset email
  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email)
      return { success: true, message: 'Password reset email sent!' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Register new user (called by existing users)
  register: async (userData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      )

      // Create user profile in Firestore
      const userProfile = {
        username: userData.username,
        email: userData.email,
        mobile: userData.mobile || '',
        role: userData.role || 'user',
        createdAt: new Date().toISOString()
      }

      await setDoc(doc(db, 'users', userCredential.user.uid), userProfile)
      await updateProfile(userCredential.user, { displayName: userData.username })

      return {
        success: true,
        user: {
          uid: userCredential.user.uid,
          ...userProfile
        }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Get current user
  getCurrentUser: () => {
    return auth.currentUser
  },

  // Auth state observer
  onAuthStateChange: (callback) => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          callback({
            uid: user.uid,
            email: user.email,
            ...userDoc.data()
          })
        } else {
          callback(null)
        }
      } else {
        callback(null)
      }
    })
  }
}
