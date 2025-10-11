# Version Management Guide

This guide explains how to manage versions for your Blood Lab Manager application deployments.

## 📦 Versioning System

We use **Semantic Versioning** (SemVer): `v1.0.0`

- **Major** (v1.x.x): Breaking changes, major features
- **Minor** (v1.1.x): New features, backward compatible
- **Patch** (v1.0.1): Bug fixes, small updates

---

## 🚀 How to Create a Version Release

### Method 1: Using NPM Scripts (Recommended)

```bash
# For bug fixes (v1.0.0 → v1.0.1)
npm run release:patch

# For new features (v1.0.0 → v1.1.0)
npm run release:minor

# For breaking changes (v1.0.0 → v2.0.0)
npm run release:major
```

These commands will:
1. ✅ Update version in `package.json`
2. ✅ Create a git commit
3. ✅ Create a git tag (e.g., `v1.0.1`)
4. ✅ Push commit and tag to GitHub
5. ✅ Trigger GitHub Actions deployment with version

---

### Method 2: Manual Tagging

```bash
# 1. Commit your changes
git add .
git commit -m "feat: add new feature"

# 2. Create a version tag
git tag v1.0.1

# 3. Push commits and tags
git push origin main
git push origin v1.0.1
```

---

## 📋 Version Examples

| Change Type | Example | Command |
|------------|---------|---------|
| Bug fix | v1.0.0 → v1.0.1 | `npm run release:patch` |
| New feature | v1.0.1 → v1.1.0 | `npm run release:minor` |
| Breaking change | v1.1.0 → v2.0.0 | `npm run release:major` |

---

## 🔍 View Deployed Versions

### In GitHub Actions:
1. Go to: https://github.com/ThanuMahee12/Blood-Lab-Manager/actions
2. Click on any workflow run
3. You'll see: **Version: v1.0.1** in the deployment summary

### In Git:
```bash
# List all version tags
git tag

# Show current version
git describe --tags
```

---

## 📊 Deployment Summary

Every deployment shows:
- **Version** (e.g., v1.0.1)
- **Commit hash**
- **Branch**
- **Deployment URL**
- **Status**

---

## 🔄 Cache Control

The deployment is configured to:
- **JS/CSS files**: Cached for 1 year (immutable)
- **index.html**: Never cached (always fresh)

This ensures:
✅ Latest changes always visible
✅ Fast loading for assets
✅ No stale version issues

---

## 💡 Best Practices

1. **Always create a tag** before deploying important changes
2. **Use semantic versioning** consistently
3. **Tag format**: Always use `v` prefix (e.g., `v1.0.1`)
4. **Commit message**: Write clear commit messages before tagging

---

## 🐛 Troubleshooting

### Problem: Old version still showing after deployment

**Solution:**
1. Clear browser cache (Ctrl + Shift + R)
2. Check Firebase Hosting cache headers
3. Wait 2-3 minutes for CDN propagation

### Problem: Version not showing in GitHub Actions

**Solution:**
1. Ensure tag is pushed: `git push --tags`
2. Check tag format: Must be `v*.*.*` (e.g., v1.0.0)
3. Re-run failed workflow

---

## 📌 Current Version

**Version:** 1.0.0

**Last Updated:** October 2025

**Deployment URL:** https://blood-lab-manager.web.app
