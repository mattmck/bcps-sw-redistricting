# Full-Stack Deployment Guide - BCPS Redistricting Tool

This guide covers deploying the complete application stack to Azure using Terraform.

## Architecture Overview

**Stack Components:**
1. **Frontend**: React 18 app → Azure Static Web Apps
2. **Backend API**: Node.js Express → Azure Container Apps
3. **Database**: PostgreSQL 15 + PostGIS → Azure Database for PostgreSQL Flexible Server

## Prerequisites

### Required Tools
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) >= 2.40
- [Terraform](https://www.terraform.io/downloads) >= 1.0
- [Docker](https://docs.docker.com/get-docker/)
- [Node.js](https://nodejs.org/) >= 18
- [Flyway](https://flywaydb.org/) (for database migrations)

### Azure Authentication
```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "YOUR_SUBSCRIPTION_ID"
```

## Quick Start

### 1. Create Azure Container Registry
```bash
az group create --name bcps-shared-rg --location eastus2
az acr create --resource-group bcps-shared-rg --name bcpsredistrictingacr --sku Basic
az acr login --name bcpsredistrictingacr
```

### 2. Build and Push API Image
```bash
cd backend
docker build -t bcpsredistrictingacr.azurecr.io/redistricting-api:latest .
docker push bcpsredistrictingacr.azurecr.io/redistricting-api:latest
cd ..
```

### 3. Configure Terraform
Create `terraform/terraform.tfvars`:
```hcl
project_name = "bcps-redistricting"
environment  = "prod"
location     = "eastus2"

db_admin_username = "bcps_admin"
db_admin_password = "CHANGE_ME_SecurePassword123!"
mapbox_api_key    = "pk.eyJ1IjoibWF0dG1jayIsImEiOiJjbWw0amh2bHUxYm54M2VwdjN1b3JkMjdkIn0.O9fkJmkoMGOFZnfRTVx2wA"
api_docker_image  = "bcpsredistrictingacr.azurecr.io/redistricting-api:latest"
```

**⚠️ IMPORTANT**: Add to `.gitignore`:
```bash
echo "terraform.tfvars" >> terraform/.gitignore
```

### 4. Deploy Infrastructure
```bash
cd terraform
terraform init
terraform plan
terraform apply  # Type 'yes' to confirm
```

### 5. Initialize Database
```bash
# Get database connection info
DB_HOST=$(terraform output -raw db_fqdn)
DB_NAME=$(terraform output -raw db_name)

# Run Flyway migrations
cd ../backend
export FLYWAY_URL="jdbc:postgresql://${DB_HOST}:5432/${DB_NAME}?sslmode=require"
export FLYWAY_USER="bcps_admin"
export FLYWAY_PASSWORD="CHANGE_ME_SecurePassword123!"
flyway migrate

# Migrate data from GeoJSON
npm install
npm run migrate
```

### 6. Deploy Frontend
```bash
cd ..
DEPLOYMENT_TOKEN=$(cd terraform && terraform output -raw deployment_token)
API_URL=$(cd terraform && terraform output -raw api_url)

# Set API URL for production build
echo "VITE_API_URL=${API_URL}" > .env.production

# Build and deploy
npm install
npm run build
npx @azure/static-web-apps-cli deploy --deployment-token $DEPLOYMENT_TOKEN --app-location dist
```

### 7. Verify
```bash
cd terraform
FRONTEND_URL=$(terraform output -raw application_url)
API_URL=$(terraform output -raw api_url)

# Test API
curl ${API_URL}/health | jq
curl ${API_URL}/api/schools | jq '.features | length'

# Open frontend
echo "Frontend: $FRONTEND_URL"
```

## Terraform Configuration

### variables.tf
Key variables:
- `db_admin_password`: PostgreSQL admin password (required)
- `mapbox_api_key`: Mapbox API key (required)
- `api_docker_image`: Docker image for API (required)
- `db_sku_name`: Database SKU (default: `B_Standard_B1ms`)
- `container_app_cpu/memory`: Container resources

### Resources Created
- `azurerm_resource_group` - Resource container
- `azurerm_log_analytics_workspace` - Logging for Container Apps
- `azurerm_postgresql_flexible_server` - PostgreSQL 15 server
- `azurerm_postgresql_flexible_server_database` - Application database
- `azurerm_postgresql_flexible_server_configuration` - PostGIS extension
- `azurerm_container_app_environment` - Container Apps environment
- `azurerm_container_app` - API container
- `azurerm_static_web_app` - Frontend hosting
- `module.secrets` - Azure Key Vault (optional)

## Environment Variables

### Backend (Container App)
Automatically set by Terraform:
```
NODE_ENV=production
DB_HOST=<postgres-fqdn>
DB_PORT=5432
DB_NAME=bcps_redistricting
DB_USER=bcps_admin
DB_PASSWORD=<from-secret>
```

### Frontend (Static Web App)
Set in `.env.production`:
```
VITE_API_URL=https://<container-app-fqdn>
```

## CI/CD with GitHub Actions

### Automated Full-Stack Deployment

The `.github/workflows/deploy-fullstack.yml` workflow automatically deploys both frontend and backend when you push to `master` or `main`.

**Features:**
- ✅ Builds and pushes Docker image to Azure Container Registry
- ✅ Updates Container App with new API version
- ✅ Verifies API health after deployment
- ✅ Builds frontend with backend API URL
- ✅ Deploys to Azure Static Web Apps
- ✅ Manual trigger option with skip flags

### Setup Secrets

Required GitHub Secrets:

```bash
# 1. Azure credentials for authentication
az ad sp create-for-rbac \
  --name "bcps-redistricting-github" \
  --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID \
  --sdk-auth > azure-credentials.json

gh secret set AZURE_CREDENTIALS < azure-credentials.json

# 2. Static Web Apps deployment token
gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN \
  --body "$(cd terraform && terraform output -raw deployment_token)"

# 3. Mapbox API key (fallback if Key Vault unavailable)
gh secret set MAPBOX_API_KEY --body "pk.your_mapbox_token"
```

**Note:** ACR credentials are not needed - the workflow uses Azure CLI authentication.

### Workflow Triggers

**Automatic:**
- Push to `master` or `main` branch

**Manual:**
```bash
# Trigger via GitHub CLI
gh workflow run deploy-fullstack.yml

# Skip backend deployment (frontend only)
gh workflow run deploy-fullstack.yml -f skip_backend=true

# Skip frontend deployment (backend only)
gh workflow run deploy-fullstack.yml -f skip_frontend=true
```

### Workflow Steps

**Backend Deployment:**
1. Login to Azure
2. Build Docker image from `backend/Dockerfile`
3. Push to Azure Container Registry
4. Update Container App with new image (tagged with git SHA)
5. Wait 30s for deployment to stabilize
6. Verify API health endpoint

**Frontend Deployment:**
1. Install dependencies
2. Get Mapbox API key from Azure Key Vault
3. Get backend API URL from Container App
4. Build React app with `VITE_API_URL` set
5. Deploy to Azure Static Web Apps
6. Display deployment summary

## Cost Estimates (US East 2)

### Development Environment
```hcl
db_sku_name  = "B_Standard_B1ms"  # ~$12/month
sku_tier     = "Free"              # $0
container_app_cpu = 0.25           # ~$10/month
```
**Total: ~$22/month**

### Production Environment
```hcl
db_sku_name  = "GP_Standard_D2s_v3"  # ~$100/month
sku_tier     = "Standard"             # ~$9/month
container_app_cpu = 0.5               # ~$20/month
```
**Total: ~$129/month**

## Monitoring and Logs

### Container App Logs
```bash
az containerapp logs show \
  --name bcps-redistricting-prod-api \
  --resource-group bcps-redistricting-prod-rg \
  --follow
```

### Log Analytics Query
```bash
WORKSPACE_ID=$(cd terraform && terraform output -raw log_analytics_workspace_id)
az monitor log-analytics query \
  --workspace $WORKSPACE_ID \
  --analytics-query "ContainerAppConsoleLogs_CL | order by TimeGenerated desc | take 100"
```

## Database Management

### Connect with psql
```bash
DB_HOST=$(cd terraform && terraform output -raw db_fqdn)
psql "postgresql://bcps_admin@${DB_HOST}:5432/bcps_redistricting?sslmode=require"
```

### Backup and Restore
```bash
# Backup
pg_dump "postgresql://bcps_admin@${DB_HOST}:5432/bcps_redistricting?sslmode=require" \
  --format=custom \
  --file=backup_$(date +%Y%m%d).dump

# Restore
pg_restore "postgresql://bcps_admin@${DB_HOST}:5432/bcps_redistricting?sslmode=require" \
  --clean --if-exists backup_20260202.dump
```

## Troubleshooting

### API Health Check Fails
```bash
# Check container status
az containerapp show --name bcps-redistricting-prod-api --resource-group bcps-redistricting-prod-rg --query "properties.runningStatus"

# View logs
az containerapp logs show --name bcps-redistricting-prod-api --resource-group bcps-redistricting-prod-rg --tail 50
```

### Database Connection Issues
```bash
# Test connectivity
psql "postgresql://bcps_admin@${DB_HOST}:5432/bcps_redistricting?sslmode=require" -c "\l"

# Check firewall rules
az postgres flexible-server firewall-rule list \
  --name bcps-redistricting-prod-pg \
  --resource-group bcps-redistricting-prod-rg
```

### Frontend Not Loading Data
1. Check API URL: `console.log(import.meta.env.VITE_API_URL)`
2. Verify CORS in Container App allows Static Web App domain
3. Check Network tab in DevTools for failed requests
4. Verify `.env.production` was used during build

## Cleanup

```bash
cd terraform
terraform destroy  # Type 'yes' to confirm
```

## Additional Resources

- [Azure Container Apps Docs](https://docs.microsoft.com/en-us/azure/container-apps/)
- [Azure PostgreSQL Flexible Server Docs](https://docs.microsoft.com/en-us/azure/postgresql/flexible-server/)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)

---

**Note**: For frontend-only deployment (without backend), see [DEPLOYMENT_FRONTEND_ONLY.md](./DEPLOYMENT_FRONTEND_ONLY.md).
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

### Azure SWA Deployment: "An unknown exception has occurred"
**Symptom:** Azure Static Web Apps deployment fails with "An unknown exception has occurred" after detecting Data API Files Directory

**Cause:** The presence of a `swa-db-connections/` directory with an empty or incomplete `staticwebapp.database.config.json` file causes Azure to attempt Data API Builder processing, which fails when the configuration is not properly set up.

**Solution:**
1. **For static-only sites (no database):** Remove the `swa-db-connections/` directory entirely
   ```bash
   rm -rf swa-db-connections
   git add swa-db-connections
   git commit -m "Remove unused database config directory"
   ```
2. **If you need Data API Builder:** Properly configure the `staticwebapp.database.config.json` file with valid connection strings and entity definitions according to [Azure Data API Builder documentation](https://learn.microsoft.com/en-us/azure/data-api-builder/)

**Note:** This app is a static-only React application with no backend database, so the database configuration directory is not needed.

### Azure Key Vault Access Denied
**Symptom:** Workflow fails at "Get Mapbox API Key from Key Vault" or shows warning "Could not retrieve Mapbox key from Key Vault"

**Solution:**
1. **If using Azure Key Vault:** Verify service principal has Key Vault read permissions:
   ```bash
   az keyvault set-policy \
     --name bcps-redistricting-prod-kv \
     --spn YOUR_SP_APP_ID \
     --secret-permissions get list
   ```
2. **Alternative:** Use GitHub Secret only (skip Key Vault):
   - The workflow automatically falls back to `MAPBOX_API_KEY` GitHub Secret
   - Ensure the GitHub Secret is set correctly (see below)

### Invalid or Short Mapbox Token
**Symptom:** Warning shows "Mapbox key retrieved (length: 18)" or similar short length

**Solution:**
1. **Check GitHub Secret is set correctly:**
   ```bash
   # Verify the secret exists
   gh secret list | grep MAPBOX_API_KEY
   
   # Set/update the secret with a valid Mapbox token
   gh secret set MAPBOX_API_KEY --body "pk.eyJ1Ijoibm..."
   ```

2. **Verify token format:**
   - Valid Mapbox tokens start with `pk.ey`
   - Tokens are typically 80-100 characters long
   - Get your token from https://account.mapbox.com/access-tokens/

3. **Common mistakes:**
   - Using a placeholder value like "your_token_here"
   - Using an incomplete token (copied only part of it)
   - Using an old or revoked token

4. **Test your token:**
   ```bash
   # Build locally with the token to verify it works
   export VITE_MAPBOX_ACCESS_TOKEN="pk.your_token_here"
   npm run build
   npm run preview
   # Open http://localhost:4173 and verify map loads
   ```

## Monitoring

### Azure Static Web Apps
- **URL:** `https://bcps-redistricting.azurestaticapps.net`
- **Dashboard:** Azure Portal → Static Web Apps → bcps-redistricting
- **Logs:** Available in Azure Portal

### GitHub Pages
- **URL:** `https://<USERNAME>.github.io/bcps-sw-redistricting/` (replace `<USERNAME>` with your GitHub username)
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
