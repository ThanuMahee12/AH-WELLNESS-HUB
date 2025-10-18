# SuperAdmin Account Setup Guide

This guide will help you set up your account as a SuperAdmin and manage the RBAC system.

## Quick Setup - Make Your Account SuperAdmin

### Method 1: Using Firebase Console (Recommended)

1. **Go to Firebase Console:**
   - Open https://console.firebase.google.com/
   - Select your project: "Blood Lab Manager"

2. **Navigate to Firestore Database:**
   - Click on "Firestore Database" in the left sidebar
   - Click on the "users" collection

3. **Find Your User Document:**
   - Look for your user document by email
   - Click on the document ID

4. **Update the Role Field:**
   - Find the `role` field
   - Change the value from `admin` or `user` to `superadmin`
   - Click "Update"

5. **Logout and Login Again:**
   - Log out from the application
   - Log back in to apply the new role

---

### Method 2: Using Firebase Admin SDK Script

Create a temporary script to update your role:

```javascript
// scripts/makeSuperAdmin.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Get from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function makeSuperAdmin(email) {
  try {
    // Find user by email
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (snapshot.empty) {
      console.log('User not found with email:', email);
      return;
    }

    // Update role to superadmin
    const userDoc = snapshot.docs[0];
    await userDoc.ref.update({
      role: 'superadmin',
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Successfully updated user to SuperAdmin!');
    console.log('User ID:', userDoc.id);
    console.log('Email:', email);
    console.log('New Role: superadmin');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Replace with your email
makeSuperAdmin('your-email@example.com');
```

Run with: `node scripts/makeSuperAdmin.js`

---

### Method 3: Manual Database Update (Development Only)

If you're using Firebase Emulator or have direct database access:

```javascript
// In your browser console while logged in
const updateToSuperAdmin = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.log('Please login first');
    return;
  }

  await setDoc(doc(db, 'users', user.uid), {
    role: 'superadmin'
  }, { merge: true });

  console.log('✅ Role updated to superadmin. Please logout and login again.');
}

updateToSuperAdmin();
```

---

## Verify SuperAdmin Status

After updating your role:

1. **Login to the application**
2. **Open Browser Console** (F12)
3. **Check your role:**

```javascript
// In browser console
const state = store.getState();
console.log('Current Role:', state.auth.user?.role);
console.log('User Data:', state.auth.user);
```

You should see: `Current Role: superadmin`

---

## SuperAdmin Capabilities

Once you're a SuperAdmin, you can:

### ✅ Direct Operations (No Approval Needed)
- Create, Edit, Delete all checkups directly
- Create, Edit, Delete all tests directly
- Create, Edit, Delete all patients directly
- Create, Edit, Delete all users directly

### ✅ User Management
- View all users including other SuperAdmins
- View user IDs (only SuperAdmin can see IDs)
- Change any user's role
- Approve/reject all pending requests
- Trigger password reset emails

### ✅ Approval Management
- View all pending edit requests from Editors
- Approve/reject Editor edit requests
- View all user management requests from Maintainers
- Approve/reject Maintainer user requests

### ✅ System Management
- Access to complete audit trail
- View all serial numbers and metadata
- Full system configuration access

---

## Where to Make Role Adjustments

### 1. **Change User Roles** (SuperAdmin Only)

**Location:** `src/pages/Users.jsx` (to be updated with role change feature)

**Programmatically:**
```javascript
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './config/firebase';
import { ROLES } from './constants/roles';

// Update user role
const changeUserRole = async (userId, newRole) => {
  await updateDoc(doc(db, 'users', userId), {
    role: newRole, // ROLES.USER, ROLES.EDITOR, ROLES.MAINTAINER, ROLES.SUPERADMIN
    lastModifiedAt: new Date().toISOString(),
    lastModifiedBy: currentUser.uid
  });
};

// Example usage
changeUserRole('userId123', ROLES.MAINTAINER);
```

---

### 2. **Adjust Permissions**

**Location:** `src/constants/roles.js`

Edit the `PERMISSIONS` object to modify what each role can do:

```javascript
export const PERMISSIONS = {
  [ROLES.SUPERADMIN]: {
    checkups: {
      view: true,
      create: true,
      edit: true,      // ← Change this
      delete: true,    // ← Change this
      generatePDF: true,
    },
    // ... more permissions
  }
}
```

---

### 3. **Modify Role Hierarchy**

**Location:** `src/constants/roles.js`

```javascript
export const ROLE_HIERARCHY = {
  [ROLES.USER]: 1,
  [ROLES.EDITOR]: 2,
  [ROLES.MAINTAINER]: 3,
  [ROLES.SUPERADMIN]: 4,  // ← Highest level
}
```

---

### 4. **Add New Roles**

**Location:** `src/constants/roles.js`

```javascript
export const ROLES = {
  USER: 'user',
  EDITOR: 'editor',
  MAINTAINER: 'maintainer',
  SUPERADMIN: 'superadmin',
  CUSTOM_ROLE: 'customrole',  // ← Add new role
}

// Then add permissions for new role
export const PERMISSIONS = {
  // ... existing roles
  [ROLES.CUSTOM_ROLE]: {
    checkups: {
      view: true,
      create: false,
      // ... define permissions
    }
  }
}
```

---

## Create Additional SuperAdmin Accounts

### Using SuperAdmin Panel (To Be Built)

Once logged in as SuperAdmin, you can create new users with any role:

```javascript
// In Users page (as SuperAdmin)
const createNewSuperAdmin = {
  username: 'New Admin',
  email: 'newadmin@bloodlab.com',
  password: 'securePassword123',
  mobile: '+91-1234567890',
  role: 'superadmin'  // SuperAdmin can set any role
}

// Call register function
dispatch(registerUser(createNewSuperAdmin));
```

### Using Firebase Console

1. Go to Firebase Console → Authentication
2. Add new user with email/password
3. Go to Firestore → users collection
4. Create new document with:
   ```json
   {
     "username": "New SuperAdmin",
     "email": "newadmin@bloodlab.com",
     "mobile": "+91-1234567890",
     "role": "superadmin",
     "createdAt": "2025-01-18T10:00:00.000Z"
   }
   ```

---

## Testing Your SuperAdmin Access

### 1. Test Direct Edit (No Approval)
```javascript
// As SuperAdmin, editing a checkup should work directly
// No edit request should be created
const result = await dispatch(updateCheckup(updatedData));
console.log('Updated directly:', result);
```

### 2. Test User ID Visibility
```javascript
// SuperAdmin should see user IDs
import { PERMISSIONS, ROLES } from './constants/roles';

const canSeeIds = PERMISSIONS[ROLES.SUPERADMIN].users.viewUserId;
console.log('Can see IDs:', canSeeIds); // true
```

### 3. Test Approval Access
```javascript
// SuperAdmin can approve any request
import { approveEditRequest } from './store/editRequestsSlice';

await dispatch(approveEditRequest({
  id: 'requestId',
  approverNotes: 'Approved by SuperAdmin'
}));
```

---

## Troubleshooting

### Issue: Role not updating after login

**Solution:**
1. Clear browser cache and cookies
2. Logout completely
3. Login again
4. Check Firestore to confirm role is `superadmin`

### Issue: Still don't see SuperAdmin features

**Solution:**
1. Open browser console
2. Run: `console.log(store.getState().auth.user)`
3. Verify role is 'superadmin'
4. If not, check Firestore database

### Issue: Permission denied errors

**Solution:**
1. Check Firestore security rules
2. Ensure your account has the correct role in Firestore
3. Verify you're logged in with the correct account

---

## Next Steps

Once you're confirmed as SuperAdmin:

1. ✅ Create the ApprovalRequests page
2. ✅ Update Users page with role management
3. ✅ Add SuperAdmin dashboard
4. ✅ Implement approval workflow UI
5. ✅ Add audit logging
6. ✅ Configure email notifications

---

## Security Notes

⚠️ **Important:**
- Never commit Firebase config or service account keys to git
- Always use environment variables for sensitive data
- Limit the number of SuperAdmin accounts
- Regularly audit SuperAdmin actions
- Implement session timeout for SuperAdmin accounts
- Use strong passwords for SuperAdmin accounts

---

## Contact

If you need help with SuperAdmin setup:
- Check RBAC_IMPLEMENTATION.md for detailed permissions
- Review src/constants/roles.js for role configuration
- Check Firebase Console for user data verification
