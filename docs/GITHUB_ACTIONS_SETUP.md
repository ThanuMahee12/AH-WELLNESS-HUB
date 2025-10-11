# GitHub Actions Auto-Deploy Setup

This guide explains how to set up automatic deployment to Firebase Hosting when code is merged to the `main` branch.

## Prerequisites

1. GitHub repository with your Blood Lab Manager code
2. Firebase project set up (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md))
3. Firebase CLI installed locally (`npm install -g firebase-tools`)

## Step 1: Get Firebase Service Account

### Option A: Using Firebase CLI (Recommended)

1. Login to Firebase:
```bash
firebase login
```

2. Initialize Firebase in your project (if not already done):
```bash
firebase init hosting
```

3. Get service account:
```bash
# This generates a service account key
firebase login:ci
```

This will output a token. **Save this token** - you'll need it for GitHub Secrets.

### Option B: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon → Project Settings
4. Go to "Service accounts" tab
5. Click "Generate new private key"
6. Download the JSON file
7. **Keep this file secure** - it contains sensitive credentials

## Step 2: Add GitHub Secrets

1. Go to your GitHub repository
2. Click "Settings" tab
3. In the left sidebar, click "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Add the following secrets one by one:

### Required Secrets

| Secret Name | Value | Example |
|-------------|-------|---------|
| `VITE_FIREBASE_API_KEY` | Your Firebase API key | `AIzaSyC...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Your Auth domain | `blood-lab-123.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Your Project ID | `blood-lab-123` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Your Storage bucket | `blood-lab-123.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your Messaging sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | Your App ID | `1:123456789:web:abc123` |
| `FIREBASE_SERVICE_ACCOUNT` | Service account JSON (entire file content) | `{"type": "service_account",...}` |

### Getting Firebase Config Values

All values (except service account) can be found in:
- Firebase Console → Project Settings → Your apps → Config

Copy the values from the `firebaseConfig` object.

### Important Notes

- **FIREBASE_SERVICE_ACCOUNT**: Paste the **entire JSON file content** (if using Option B from Step 1)
  - OR use the token from `firebase login:ci` (if using Option A from Step 1)
- **Do not add quotes** around secret values in GitHub
- **Triple-check** all values - typos will cause deployment failures

## Step 3: Test the Workflow

### Trigger Automatic Deployment

1. Make a small change to your code (e.g., update README)
2. Commit and push to `main` branch:
```bash
git add .
git commit -m "feat: test auto-deployment"
git push origin main
```

3. Watch the deployment:
   - Go to GitHub repository → Actions tab
   - You should see a workflow run starting
   - Click on it to see live logs

### Manual Trigger (Optional)

You can also trigger deployment manually:

1. Go to GitHub repository → Actions tab
2. Click "Deploy to Firebase Hosting" workflow
3. Click "Run workflow" button
4. Select `main` branch
5. Click "Run workflow"

## Step 4: Verify Deployment

Once the workflow completes successfully:

1. Check the Actions log for the deployment URL
2. Or go to Firebase Console → Hosting
3. Your app should be live at: `https://your-project-id.web.app`

## Workflow File Explained

The workflow file is at `.github/workflows/firebase-deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main        # Triggers on push to main branch
  workflow_dispatch:  # Allows manual trigger

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      # 1. Get the code
      - name: Checkout code
        uses: actions/checkout@v4

      # 2. Set up Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      # 3. Install dependencies
      - name: Install dependencies
        run: npm ci

      # 4. Create .env file from GitHub Secrets
      - name: Create .env file
        run: |
          echo "VITE_FIREBASE_API_KEY=${{ secrets.VITE_FIREBASE_API_KEY }}" >> .env
          echo "VITE_FIREBASE_AUTH_DOMAIN=${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}" >> .env
          # ... other env variables

      # 5. Build the app
      - name: Build project
        run: npm run build

      # 6. Deploy to Firebase
      - name: Deploy to Firebase Hosting
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
```

## Troubleshooting

### Deployment Fails with "Firebase config not found"

**Problem**: Missing or incorrect Firebase secrets

**Solution**:
1. Verify all `VITE_FIREBASE_*` secrets are set in GitHub
2. Check for typos in secret names (they're case-sensitive)
3. Ensure no trailing spaces in secret values

### "Permission denied" or "Invalid service account"

**Problem**: Incorrect or invalid `FIREBASE_SERVICE_ACCOUNT`

**Solution**:
1. Regenerate service account key from Firebase Console
2. Ensure you copied the **entire JSON content**
3. Verify the JSON is valid (use a JSON validator)
4. Try using `firebase login:ci` token instead

### Build succeeds but deployment fails

**Problem**: Firebase project configuration issue

**Solution**:
1. Check `.firebaserc` file has correct project ID
2. Verify `firebase.json` is properly configured
3. Ensure Firebase Hosting is enabled in Firebase Console
4. Check Firebase project permissions

### "npm ci" fails

**Problem**: Package lock file mismatch

**Solution**:
1. Delete `node_modules` locally
2. Delete `package-lock.json`
3. Run `npm install`
4. Commit updated `package-lock.json`
5. Push to trigger new build

### Environment variables not loaded in build

**Problem**: Variables not prefixed with `VITE_`

**Solution**:
- All environment variables must start with `VITE_` for Vite
- Example: `VITE_FIREBASE_API_KEY` (correct) vs `FIREBASE_API_KEY` (won't work)

## Advanced Configuration

### Deploy to Preview Channel

To deploy to a preview URL instead of production:

```yaml
- name: Deploy to Firebase Hosting
  uses: FirebaseExtended/action-hosting-deploy@v0
  with:
    repoToken: ${{ secrets.GITHUB_TOKEN }}
    firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
    channelId: preview  # Changed from 'live'
    projectId: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
```

### Deploy Only on PR Merge

To deploy only when PRs are merged (not every push):

```yaml
on:
  pull_request:
    types: [closed]
    branches:
      - main

jobs:
  build-and-deploy:
    if: github.event.pull_request.merged == true
    # ... rest of the workflow
```

### Multiple Environments

Set up separate workflows for staging/production:

1. Create `.github/workflows/deploy-staging.yml`
2. Use different Firebase projects
3. Use different GitHub Secrets for each environment
4. Trigger on different branches

## Security Best Practices

1. **Never commit secrets** to Git
2. **Rotate service accounts** periodically
3. **Use least-privilege** access for service accounts
4. **Enable branch protection** for `main` branch
5. **Require PR reviews** before merging
6. **Use separate Firebase projects** for dev/staging/prod

## Monitoring Deployments

### GitHub Actions Dashboard
- View all deployment runs
- See success/failure status
- Download logs for debugging

### Firebase Hosting Dashboard
- View deployment history
- Rollback to previous versions
- Monitor traffic and performance

### Set Up Notifications

Get notified of deployment status:

1. Go to GitHub repository → Settings → Notifications
2. Enable email notifications for workflow runs
3. Or use GitHub mobile app for push notifications

## Cost Considerations

### GitHub Actions
- **2,000 minutes/month free** for public repos
- **Unlimited for public repos** on standard runners
- **Private repos**: See GitHub pricing

### Firebase Hosting
- **Free tier**: 10GB storage, 360MB/day bandwidth
- **Sufficient for**: Most small-medium deployments
- **Upgrade if**: High traffic or large assets

## Next Steps

After setting up auto-deploy:

1. **Test thoroughly**: Make several test deployments
2. **Set up staging**: Create a staging branch/environment
3. **Add tests**: Run tests before deployment
4. **Monitor**: Set up Firebase Performance Monitoring
5. **Document**: Update team on deployment process

## Support

- **GitHub Actions Docs**: https://docs.github.com/actions
- **Firebase Hosting CI/CD**: https://firebase.google.com/docs/hosting/github-integration
- **Firebase Support**: https://firebase.google.com/support

## Quick Reference

### Deploy Process
1. Code changes → Push to `main`
2. GitHub Actions triggers automatically
3. Builds app with Vite
4. Deploys to Firebase Hosting
5. Live at `https://your-project-id.web.app`

### Manual Deploy (Local)
```bash
npm run build
firebase deploy --only hosting
```

### View Deployment Status
- GitHub: Repository → Actions tab
- Firebase: Console → Hosting → Release history

### Rollback Deployment
Firebase Console → Hosting → Previous releases → Rollback
