# Production Deployment Guide

This application supports two deployment options:

## Option 1: Azure Static Web Apps (Primary)

### Prerequisites
- Azure subscription
- Azure Static Web Apps resource created
- Azure Key Vault for secrets (optional, recommended for production)

### Required GitHub Secrets
1. `AZURE_STATIC_WEB_APPS_API_TOKEN` - Deployment token from Azure Static Web Apps
2. `MAPBOX_API_KEY` - Mapbox API token for map functionality
3. `AZURE_CREDENTIALS` - Azure service principal credentials (if using Key Vault)

### Setup Steps

#### 1. Create Azure Static Web App
```bash
az staticwebapp create \
  --name bcps-redistricting \
  --resource-group bcps-redistricting-prod \
  --location eastus2 \
  --sku Free
```

#### 2. Get Deployment Token
```bash
az staticwebapp secrets list \
  --name bcps-redistricting \
  --query "properties.apiKey" -o tsv
```

#### 3. Add GitHub Secrets
```bash
# Add deployment token
gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body "YOUR_DEPLOYMENT_TOKEN"

# Add Mapbox API key
gh secret set MAPBOX_API_KEY --body "pk.your_mapbox_token"

# Add Azure credentials (if using Key Vault)
gh secret set AZURE_CREDENTIALS --body "$(az ad sp create-for-rbac --name bcps-redistricting-github --sdk-auth)"
```

### Deployment Workflow
The `deploy.yml` workflow automatically deploys to Azure Static Web Apps when:
- Code is pushed to `master` or `main` branch
- Manually triggered via GitHub Actions UI

**Workflow file:** `.github/workflows/deploy.yml`

## Option 2: GitHub Pages (Alternative)

### Prerequisites
- GitHub repository with Pages enabled
- MAPBOX_API_KEY secret configured

### Setup Steps

#### 1. Enable GitHub Pages
Go to repository Settings → Pages:
- Source: GitHub Actions
- No custom domain needed (uses `username.github.io/repo-name`)

#### 2. Add Mapbox Secret
```bash
gh secret set MAPBOX_API_KEY --body "pk.your_mapbox_token"
```

#### 3. Disable Azure Workflow (to avoid conflicts)
Rename or delete `.github/workflows/deploy.yml` to prevent both workflows from running:
```bash
mv .github/workflows/deploy.yml .github/workflows/deploy.yml.disabled
```

### Deployment Workflow
The `deploy-pages.yml` workflow automatically deploys to GitHub Pages when:
- Code is pushed to `master` or `main` branch
- Manually triggered via GitHub Actions UI

**Workflow file:** `.github/workflows/deploy-pages.yml`

**Live URL:** `https://username.github.io/bcps-sw-redistricting/`

## Choosing a Deployment Option

### Use Azure Static Web Apps if:
- You need custom domain with SSL
- You want serverless API integration
- You need enterprise features (authentication, staging environments)
- You have existing Azure infrastructure

### Use GitHub Pages if:
- You want free, simple hosting
- You don't need custom domain
- You have a public repository
- You want zero infrastructure management

## Environment Variables

### VITE_MAPBOX_ACCESS_TOKEN
The Mapbox API token is required for map functionality:
- **Source:** GitHub Secret `MAPBOX_API_KEY`
- **Build-time injection:** Vite bundles this into the JavaScript
- **Security:** Token is masked in logs via `::add-mask::`

### GITHUB_PAGES
Controls the base path for assets:
- `true`: Uses `/bcps-sw-redistricting/` base path for GitHub Pages
- Not set or `false`: Uses `/` for custom domain or Azure

## Deployment Process

### Azure Static Web Apps
1. Workflow triggers on push to master/main
2. Node.js environment setup
3. Dependencies installed via `npm ci`
4. Azure login (if using Key Vault)
5. Mapbox token retrieved from Key Vault or GitHub Secret
6. Application built with `npm run build`
7. Built files uploaded to Azure Static Web Apps
8. Deployment complete ✅

### GitHub Pages
1. Workflow triggers on push to master/main
2. Node.js environment setup
3. Dependencies installed via `npm ci`
4. Mapbox token retrieved from GitHub Secret
5. Application built with `npm run build` (with GITHUB_PAGES=true)
6. Built files uploaded as Pages artifact
7. Artifact deployed to GitHub Pages
8. Deployment complete ✅

## Manual Deployment

### Trigger via GitHub Actions UI
1. Go to repository → Actions
2. Select workflow (Deploy to Azure or Deploy to GitHub Pages)
3. Click "Run workflow"
4. Select branch (master/main)
5. Click "Run workflow" button

### Local Build and Deploy
```bash
# Install dependencies
npm ci

# Set Mapbox token
export VITE_MAPBOX_ACCESS_TOKEN="pk.your_token_here"

# Build for production
npm run build

# For GitHub Pages, also set:
export GITHUB_PAGES=true
npm run build

# Preview locally
npm run preview

# Deploy manually (Azure CLI)
az staticwebapp upload --app-name bcps-redistricting --output-location dist
```

## Troubleshooting

### Map Not Loading
**Symptom:** Blank map or console errors about Mapbox token

**Solution:**
1. Verify `MAPBOX_API_KEY` secret is set in GitHub
2. Check GitHub Actions logs for token masking (`***`)
3. Verify token in dist/assets/*.js files (look for `pk.ey`)
4. Check Mapbox dashboard for API usage/restrictions

### Deployment Failed
**Symptom:** GitHub Actions workflow fails

**Solution:**
1. Check workflow logs for specific error
2. Verify all required secrets are configured
3. For Azure: Verify Azure credentials and Static Web Apps token
4. For GitHub Pages: Verify Pages is enabled in repository settings

### Wrong Base Path (404 on Assets)
**Symptom:** App loads but assets return 404

**Solution:**
- **GitHub Pages:** Ensure `GITHUB_PAGES=true` in workflow
- **Azure/Custom Domain:** Ensure `GITHUB_PAGES` is NOT set
- Check `vite.config.ts` base path configuration
- Rebuild and redeploy

### Azure Key Vault Access Denied
**Symptom:** Workflow fails at "Get Mapbox API Key from Key Vault"

**Solution:**
1. Verify service principal has Key Vault read permissions:
   ```bash
   az keyvault set-policy \
     --name bcps-redistricting-prod-kv \
     --spn YOUR_SP_APP_ID \
     --secret-permissions get list
   ```
2. Workflow will automatically fallback to GitHub Secret

## Monitoring

### Azure Static Web Apps
- **URL:** `https://bcps-redistricting.azurestaticapps.net`
- **Dashboard:** Azure Portal → Static Web Apps → bcps-redistricting
- **Logs:** Available in Azure Portal

### GitHub Pages
- **URL:** `https://mattmck.github.io/bcps-sw-redistricting/`
- **Status:** Repository → Settings → Pages
- **Logs:** Repository → Actions → Deploy to GitHub Pages workflow

## Security

✅ **Secrets Management:** Tokens stored in GitHub Secrets (encrypted)  
✅ **Log Masking:** API tokens masked in workflow logs  
✅ **Build-time Injection:** Tokens embedded at build time, not runtime  
✅ **HTTPS:** Both platforms serve over HTTPS by default  
✅ **No Backend:** Static site, no server-side secrets exposure

## References

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Mapbox Access Tokens](https://docs.mapbox.com/help/getting-started/access-tokens/)
