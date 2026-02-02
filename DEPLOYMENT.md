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

### Setup Secrets
```bash
# Azure credentials
az ad sp create-for-rbac \
  --name "bcps-redistricting-github" \
  --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID \
  --sdk-auth > azure-credentials.json

gh secret set AZURE_CREDENTIALS < azure-credentials.json

# Other secrets
gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body "$(cd terraform && terraform output -raw deployment_token)"
gh secret set ACR_USERNAME --body "$(az acr credential show --name bcpsredistrictingacr --query username -o tsv)"
gh secret set ACR_PASSWORD --body "$(az acr credential show --name bcpsredistrictingacr --query passwords[0].value -o tsv)"
gh secret set DB_ADMIN_PASSWORD --body "CHANGE_ME_SecurePassword123!"
gh secret set MAPBOX_API_KEY --body "pk.your_mapbox_token"
```

### Workflow Example
See `.github/workflows/deploy-fullstack.yml`:
```yaml
name: Deploy Full Stack

on:
  push:
    branches: [ master ]

jobs:
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and push API
        run: |
          docker build -t $ACR_REGISTRY/redistricting-api:$GITHUB_SHA ./backend
          docker push $ACR_REGISTRY/redistricting-api:$GITHUB_SHA
      - name: Update Container App
        run: |
          az containerapp update \
            --name bcps-redistricting-prod-api \
            --resource-group bcps-redistricting-prod-rg \
            --image $ACR_REGISTRY/redistricting-api:$GITHUB_SHA
  
  deploy-frontend:
    needs: deploy-api
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci && npm run build
      - uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          app_location: "dist"
```

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
