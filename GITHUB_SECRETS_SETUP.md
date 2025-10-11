# GitHub Secrets Setup Guide

Firebase CLI has automatically set up GitHub Actions for deployment. However, you need to add your Firebase environment variables as GitHub Secrets for the build process to work.

## Required GitHub Secrets

You need to add these secrets to your GitHub repository:

### Firebase Configuration Secrets

| Secret Name | Value | Where to Find |
|-------------|-------|---------------|
| `VITE_FIREBASE_API_KEY` | Your API key | From your `.env` file |
| `VITE_FIREBASE_AUTH_DOMAIN` | Your auth domain | From your `.env` file |
| `VITE_FIREBASE_PROJECT_ID` | Your project ID | From your `.env` file |
| `VITE_FIREBASE_STORAGE_BUCKET` | Your storage bucket | From your `.env` file |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your messaging sender ID | From your `.env` file |
| `VITE_FIREBASE_APP_ID` | Your app ID | From your `.env` file |
| `VITE_FIREBASE_MEASUREMENT_ID` | Your measurement ID | From your `.env` file |

### Service Account (Already Added!)

Firebase CLI has already added:
- ✅ `FIREBASE_SERVICE_ACCOUNT_BLOOD_LAB_MANAGER` - Already configured by Firebase CLI

## How to Add GitHub Secrets

### Step 1: Go to Repository Settings

1. Open your GitHub repository: https://github.com/ThanuMahee12/Blood-Lab-Manager
2. Click **Settings** tab (at the top)
3. In the left sidebar, click **Secrets and variables**
4. Click **Actions**

### Step 2: Add Each Secret

For each secret in the table above:

1. Click **New repository secret** button
2. Name: Enter the exact secret name (e.g., `VITE_FIREBASE_API_KEY`)
3. Secret: Paste the value from your `.env` file
4. Click **Add secret**

**Example:**
```
Name: VITE_FIREBASE_API_KEY
Secret: AIzaSyC... (copy from your .env file)
```

### Step 3: Verify All Secrets

After adding all secrets, you should see 8 secrets total:

- ✅ FIREBASE_SERVICE_ACCOUNT_BLOOD_LAB_MANAGER (already added by Firebase CLI)
- ⬜ VITE_FIREBASE_API_KEY
- ⬜ VITE_FIREBASE_AUTH_DOMAIN
- ⬜ VITE_FIREBASE_PROJECT_ID
- ⬜ VITE_FIREBASE_STORAGE_BUCKET
- ⬜ VITE_FIREBASE_MESSAGING_SENDER_ID
- ⬜ VITE_FIREBASE_APP_ID
- ⬜ VITE_FIREBASE_MEASUREMENT_ID

## Quick Copy from .env

Open your `.env` file and copy the values one by one:

```env
VITE_FIREBASE_API_KEY=AIzaSyC...  ← Copy this value
VITE_FIREBASE_AUTH_DOMAIN=blood-lab-manager.firebaseapp.com  ← Copy this
VITE_FIREBASE_PROJECT_ID=blood-lab-manager  ← Copy this
VITE_FIREBASE_STORAGE_BUCKET=blood-lab-manager.appspot.com  ← Copy this
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789  ← Copy this
VITE_FIREBASE_APP_ID=1:123456789:web:abc123  ← Copy this
VITE_FIREBASE_MEASUREMENT_ID=G-1ZKX1J6E3P  ← Copy this
```

## Test the Deployment

Once all secrets are added:

### Method 1: Push to Main
```bash
git add .
git commit -m "feat: complete Firebase integration"
git push origin main
```

The deployment will:
1. Automatically trigger on push to `main`
2. Build the app using the secrets
3. Deploy to Firebase Hosting
4. Your app will be live at: `https://blood-lab-manager.web.app`

### Method 2: Manual Trigger

1. Go to GitHub repository → **Actions** tab
2. Click **Deploy to Firebase Hosting on merge** workflow
3. Click **Run workflow** (if available)
4. Check the workflow run for any errors

## Troubleshooting

### Build Fails with "VITE_FIREBASE_* is undefined"

**Problem**: Environment variables not loaded

**Solution**:
1. Verify all 7 `VITE_FIREBASE_*` secrets are added
2. Check secret names are EXACTLY as shown (case-sensitive)
3. Ensure no trailing spaces in secret values
4. Re-run the workflow

### Deployment Succeeds but App Doesn't Load

**Problem**: Environment variables might be incorrect

**Solution**:
1. Check browser console for errors
2. Verify all values in GitHub Secrets match your `.env`
3. Make sure values were copied correctly

### "Permission denied" Errors

**Problem**: Service account permissions

**Solution**:
- Firebase CLI should have set this up correctly
- If issues persist, check Firebase Console → IAM & Admin
- Ensure service account has "Firebase Hosting Admin" role

## Workflows Created by Firebase

Firebase CLI created these workflows:

### 1. `firebase-hosting-merge.yml`
- **Triggers**: Push to `main` branch
- **Action**: Build and deploy to production
- **URL**: https://blood-lab-manager.web.app

### 2. `firebase-hosting-pull-request.yml`
- **Triggers**: Pull request opened/updated
- **Action**: Build and deploy to preview channel
- **URL**: Temporary preview URL for testing

## Viewing Workflow Runs

1. Go to GitHub repository
2. Click **Actions** tab
3. See all workflow runs
4. Click on a run to see detailed logs
5. Check for errors in "Create .env file" or "Build project" steps

## Security Notes

### Safe to Expose
✅ All `VITE_FIREBASE_*` values are safe in GitHub Secrets
✅ They identify your Firebase project but don't grant access
✅ Security comes from Firestore Rules and Authentication

### Keep Secret
⚠️ `FIREBASE_SERVICE_ACCOUNT_BLOOD_LAB_MANAGER` - This IS sensitive
⚠️ Never expose service account JSON in code or logs
⚠️ Firebase CLI handles this automatically

## Next Steps

After setting up secrets:

1. ✅ Add all 7 `VITE_FIREBASE_*` secrets
2. ✅ Push code to trigger deployment
3. ✅ Check Actions tab for deployment status
4. ✅ Visit your live site: https://blood-lab-manager.web.app
5. ✅ Test login functionality

## Quick Reference

### GitHub Secrets Page
https://github.com/ThanuMahee12/Blood-Lab-Manager/settings/secrets/actions

### GitHub Actions Page
https://github.com/ThanuMahee12/Blood-Lab-Manager/actions

### Firebase Hosting Dashboard
https://console.firebase.google.com/project/blood-lab-manager/hosting

### Your Live App
https://blood-lab-manager.web.app

---

**Need Help?**
- Check workflow logs in GitHub Actions
- Review [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md)
- See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
