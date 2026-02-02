# Quick Setup: Mapbox API Key

This guide helps you set up the Mapbox API key for deployment.

## Get Your Mapbox Token

1. Go to https://account.mapbox.com/access-tokens/
2. Sign in (create account if needed - it's free)
3. Click "Create a token" or use an existing token
4. Copy the **entire** token (starts with `pk.ey`, typically 80-100 characters)

**Example valid token format:**
```
pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUxMjM0NTY3ODkwIn0.example_signature_here
```

## Add to GitHub Secrets

### Option 1: GitHub CLI (Recommended)
```bash
# Make sure you have gh CLI installed and authenticated
gh auth login

# Set the secret (paste your token when prompted)
gh secret set MAPBOX_API_KEY

# Or set it directly
gh secret set MAPBOX_API_KEY --body "pk.eyJ1Ijoib..."
```

### Option 2: GitHub Web UI
1. Go to repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `MAPBOX_API_KEY`
4. Value: Paste your **entire** Mapbox token
5. Click "Add secret"

## Verify Setup

After setting the secret, verify it's configured:

```bash
# Check if secret exists
gh secret list | grep MAPBOX_API_KEY

# Expected output:
# MAPBOX_API_KEY  Updated YYYY-MM-DD
```

## Test Locally

Before deploying, test that your token works:

```bash
# Set token in your environment
export VITE_MAPBOX_ACCESS_TOKEN="pk.your_actual_token_here"

# Build the app
npm run build

# Preview the build
npm run preview

# Open http://localhost:4173 in browser
# Verify that the map loads correctly
```

## Common Issues

### ❌ Token Too Short (18 characters or less)
**Problem:** You likely set a placeholder value like "your_token_here"  
**Solution:** Get a real token from Mapbox and update the GitHub Secret

### ❌ Map Doesn't Load
**Problem:** Invalid or revoked token  
**Solution:** 
1. Check Mapbox dashboard for token status
2. Create a new token if needed
3. Update GitHub Secret with new token

### ❌ "Unauthorized" or 401 Errors
**Problem:** Token doesn't have necessary permissions  
**Solution:** 
1. Go to Mapbox access tokens page
2. Ensure token has "Default public token" scope
3. Or create a new token with default scopes

## Token Security

✅ **DO:**
- Store in GitHub Secrets (encrypted)
- Use separate tokens for dev/staging/prod
- Rotate tokens periodically
- Use token restrictions (optional)

❌ **DON'T:**
- Commit tokens to Git
- Share tokens publicly
- Use the same token across multiple projects (optional)
- Use secret tokens (starting with `sk.`) for frontend apps

## Token Types

**Public tokens** (pk.*) - ✅ Safe for frontend apps
- Suitable for web apps
- Can be embedded in JavaScript
- Usage tracked per domain

**Secret tokens** (sk.*) - ❌ Not for frontend
- Backend/server use only
- Higher permissions
- Must not be exposed to clients

## Need Help?

1. Check deployment logs in GitHub Actions
2. Look for "Mapbox key retrieved (length: XX)" in logs
3. If length < 50, your secret is incorrect
4. See DEPLOYMENT.md for full troubleshooting guide

## Resources

- [Mapbox Access Tokens Docs](https://docs.mapbox.com/help/getting-started/access-tokens/)
- [GitHub Secrets Docs](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
