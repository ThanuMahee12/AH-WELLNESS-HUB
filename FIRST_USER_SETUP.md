# Creating Your First Admin User

Since the app now uses Firebase Authentication, you need to create your first user in Firebase. Here are two methods:

## Method 1: Using Firebase Console (Recommended - Easiest)

### Step 1: Create Auth User
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **blood-lab-manager**
3. Click **Authentication** in the left menu
4. Click **Users** tab
5. Click **Add user** button
6. Enter:
   - **Email**: your-email@example.com (e.g., `admin@bloodlab.com`)
   - **Password**: your-secure-password (e.g., `admin123`)
7. Click **Add user**
8. **Copy the User UID** (you'll need this for next step)

### Step 2: Create Firestore Profile
1. In Firebase Console, click **Firestore Database** in the left menu
2. Click **Start collection** (if first time) or click **Add collection**
3. Collection ID: `users`
4. Click **Next**
5. Document ID: **Paste the User UID from Step 1**
6. Add these fields:

| Field | Type | Value |
|-------|------|-------|
| username | string | Admin |
| email | string | admin@bloodlab.com (same as Step 1) |
| mobile | string | 1234567890 |
| role | string | admin |
| createdAt | string | 2025-01-11T00:00:00.000Z |

7. Click **Save**

### Step 3: Test Login
1. Go to your app: http://localhost:5173 (or deployed URL)
2. Click **Login**
3. Enter the email and password from Step 1
4. You should be logged in successfully!

---

## Method 2: Using Firebase Admin SDK (For Developers)

If you prefer to use code, create a script:

### 1. Install Firebase Admin
```bash
npm install firebase-admin --save-dev
```

### 2. Get Service Account Key
1. Firebase Console → Project Settings → Service accounts
2. Click "Generate new private key"
3. Save the JSON file as `service-account-key.json` in project root
4. **Add to .gitignore** (already done)

### 3. Create Setup Script

Create `create-admin.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const createAdminUser = async () => {
  try {
    // Create authentication user
    const userRecord = await admin.auth().createUser({
      email: 'admin@bloodlab.com',
      password: 'admin123',
      displayName: 'Admin'
    });

    console.log('✅ Created Auth user:', userRecord.uid);

    // Create Firestore profile
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      username: 'Admin',
      email: 'admin@bloodlab.com',
      mobile: '1234567890',
      role: 'admin',
      createdAt: new Date().toISOString()
    });

    console.log('✅ Created Firestore profile');
    console.log('✅ Admin user setup complete!');
    console.log('   Email: admin@bloodlab.com');
    console.log('   Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createAdminUser();
```

### 4. Run the Script
```bash
node create-admin.js
```

### 5. Clean Up
```bash
# Remove the service account key (for security)
rm service-account-key.json

# Uninstall firebase-admin if not needed
npm uninstall firebase-admin
```

---

## Method 3: From Your App (If You Already Have Access)

Once you have at least one user, that user can create new users from within the app:

1. Login to the app
2. Go to **Users** page
3. Click **Add User**
4. Fill in the form:
   - Username
   - Email
   - Password
   - Mobile
   - Role (admin/user)
5. Click **Save**

The new user will be created in both Firebase Auth and Firestore automatically.

---

## Important Notes

### Security
- ⚠️ **Change default password** after first login
- ⚠️ **Never commit service account keys** to Git
- ✅ Service account key is already in `.gitignore`

### Troubleshooting

**"User not found" after login**
- Make sure you created BOTH:
  1. Authentication user (in Firebase Auth)
  2. Firestore profile (in Firestore users collection)
- Document ID in Firestore must match Auth UID

**"Permission denied"**
- Check Firestore Security Rules are deployed
- Ensure rules allow authenticated users
- Deploy rules: `firebase deploy --only firestore:rules`

**Can't find users collection**
- Create it manually in Firestore Console
- Or let the app create it when first user is added

---

## Next Steps

After creating your admin user:

1. **Test the login** - Make sure you can log in
2. **Create more users** - Add users from the Users page
3. **Add sample data** - Create some patients and tests
4. **Update Firestore Rules** - For production security
5. **Change passwords** - Update default passwords

---

## Production Recommendations

### Before Going Live:

1. **Update Security Rules**
```javascript
// More restrictive rules for production
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /patients/{document} {
      allow read, write: if request.auth != null;
    }

    match /tests/{document} {
      allow read, write: if request.auth != null;
    }

    match /checkups/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

2. **Enable Email Verification**
```javascript
// In authService.js
const userCredential = await createUserWithEmailAndPassword(auth, email, password);
await sendEmailVerification(userCredential.user);
```

3. **Set Password Requirements**
- Minimum 8 characters
- Include uppercase, lowercase, numbers
- Enforce in Firebase Auth settings

4. **Monitor Usage**
- Set up Firebase billing alerts
- Monitor Authentication usage
- Track Firestore reads/writes

---

## Quick Reference

### Default Admin Credentials (Development)
- **Email**: admin@bloodlab.com
- **Password**: admin123

### Firestore Collections
- `users` - User profiles
- `patients` - Patient records
- `tests` - Blood test catalog
- `checkups` - Bills/checkups

### Firebase Console Links
- Authentication: https://console.firebase.google.com/project/blood-lab-manager/authentication/users
- Firestore: https://console.firebase.google.com/project/blood-lab-manager/firestore
- Security Rules: https://console.firebase.google.com/project/blood-lab-manager/firestore/rules

---

**Need Help?**
- Check [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for full Firebase setup
- See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for deployment help
- Review error messages in browser console
