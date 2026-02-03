# Backend Deployment Guide

This guide covers deploying the PostgreSQL + PostGIS backend to Azure.

## Deployment Status

**Current State:**
- ✅ Local: Backend running on Docker (PostgreSQL + API)
- ✅ Azure: Frontend deployed to Static Web Apps
- ❌ Azure: Backend **not yet deployed** (PostgreSQL + Container App pending)

## Prerequisites

Before deploying the backend to Azure:

1. **Azure Resources:**
   - ✅ Resource Group: `bcps-redistricting-prod-rg`
   - ✅ Azure Container Registry: `bcpsredistrictingacr`
   - ❌ PostgreSQL Flexible Server (will be created by Terraform)
   - ❌ Container App (will be created by Terraform)

2. **Required Secrets:**
   - ✅ `AZURE_CREDENTIALS` - GitHub Secret
   - ✅ `AZURE_STATIC_WEB_APPS_API_TOKEN` - GitHub Secret
   - ✅ `MAPBOX_API_KEY` - GitHub Secret

3. **Local Testing:**
   ```bash
   # Verify backend is working locally
   curl http://localhost:4000/health
   curl http://localhost:4000/api/schools | jq '.features | length'  # Should return 11
   curl http://localhost:4000/api/planning-blocks | jq '.features | length'  # Should return 182
   curl http://localhost:4000/api/options | jq 'length'  # Should return 5
   ```

## Deployment Options

Choose your deployment strategy:

### **Option A: Fully Automated (GitHub Actions + Terraform)** 🤖

**Best for:** Production environments, teams, hands-off automation

**What it does:** GitHub Actions handles **everything** - infrastructure creation via Terraform, database migrations, and code deployments.

**Setup Requirements:**
1. **One-Time**: Configure GitHub secrets (8 required secrets)
2. **One-Time**: Create Azure Storage for Terraform state
3. **Push to master**: Automatic deployment on every commit

**See:** [docs/GITHUB_SECRETS_SETUP.md](docs/GITHUB_SECRETS_SETUP.md) for complete setup guide

**Workflows:**
- `.github/workflows/deploy-infrastructure.yml` - Creates/updates Azure infrastructure via Terraform
- `.github/workflows/deploy-fullstack.yml` - Deploys code (backend + frontend)

**Usage:**
```bash
# Trigger infrastructure deployment (creates PostgreSQL, Container App, etc.)
gh workflow run deploy-infrastructure.yml -f terraform_action=apply

# After infrastructure exists, just push code to master
git checkout master
git merge your-feature-branch
git push origin master  # Automatically deploys backend + frontend
```

**Pros:**
- ✅ Zero manual steps after initial setup
- ✅ Consistent deployments every time
- ✅ Automatic database migrations
- ✅ Built-in rollback via workflow history
- ✅ Team-friendly (anyone can deploy)

**Cons:**
- ⚠️ Requires 8 GitHub secrets setup
- ⚠️ Terraform state in Azure Storage (extra resource)
- ⚠️ More complex initial configuration

---

### **Option B: Manual Terraform + Automated Deployments** 🛠️

**Best for:** Solo developers, full control, testing environments

**What it does:** You run Terraform **once** locally to create infrastructure. After that, GitHub Actions handles all code deployments automatically.

**Initial Setup (One-Time):**

```bash
# 1. Run setup script to create ACR and push Docker image
./scripts/setup-azure-backend.sh

# This will:
# - Create Azure Container Registry
# - Build and push backend Docker image
# - Create/update terraform.tfvars

# 2. Edit terraform.tfvars with required values
cd terraform
nano terraform.tfvars  # Set db_admin_password and verify other values

# 3. Deploy infrastructure with Terraform
terraform init
terraform plan  # Review what will be created
terraform apply # Creates PostgreSQL + Container App + Log Analytics

# 4. Run database migrations (one-time)
# See "Post-Deployment Steps" below
```

**After Infrastructure Exists:**

```bash
# Just push to master - GitHub Actions handles deployment
git checkout master
git merge your-feature-branch
git push origin master  # Automatically deploys via deploy-fullstack.yml

# Or trigger manually
gh workflow run deploy-fullstack.yml
```

**Pros:**
- ✅ Simpler setup (only 3 GitHub secrets needed)
- ✅ Full control over infrastructure changes
- ✅ Terraform state stays local (simpler)
- ✅ Automated code deployments (same as Option A)

**Cons:**
- ⚠️ Manual Terraform commands for infrastructure changes
- ⚠️ Requires local Terraform state management
- ⚠️ Initial database migrations are manual

---

### **Comparison Table**

| Feature | Option A (Full Automation) | Option B (Manual Terraform) |
|---------|----------------------------|-----------------------------|
| Infrastructure Creation | GitHub Actions (Terraform) | Local Terraform CLI |
| Code Deployments | GitHub Actions ✅ | GitHub Actions ✅ |
| Database Migrations | Automatic ✅ | Manual (one-time) |
| GitHub Secrets Required | 8 | 3 |
| Terraform State | Azure Storage | Local |
| Initial Setup Complexity | High | Medium |
| Ongoing Maintenance | Zero | Low |
| Best For | Production | Development |

---

### **Recommended Approach**

**Start with Option B** → Graduate to Option A when ready for production:

1. Use **Option B** during development to maintain control
2. Switch to **Option A** when deploying to production for full automation
3. Both options use the same Terraform code and GitHub Actions workflows

## Terraform Infrastructure

When you run `terraform apply`, it will create:

### **New Azure Resources:**

1. **PostgreSQL Flexible Server**
   - Version: PostgreSQL 15
   - Extension: PostGIS 3.4
   - SKU: `B_Standard_B1ms` (Basic, ~$12/month)
   - Storage: 32GB (configurable)
   - Backups: 7 days retention

2. **PostgreSQL Database**
   - Name: `bcps_redistricting`
   - Charset: UTF8
   - Collation: en_US.utf8

3. **Container Apps Environment**
   - Includes Log Analytics workspace
   - Container orchestration platform

4. **Container App (API)**
   - Image: From Azure Container Registry
   - CPU: 0.25 cores (configurable)
   - Memory: 0.5Gi (configurable)
   - Port: 4000
   - Auto-scaling: 1-3 replicas
   - Environment variables: DB connection details
   - Health checks: Enabled

5. **Log Analytics Workspace**
   - Retention: 30 days
   - Used for Container App logs

### **Estimated Costs:**

**Development/Testing:**
- PostgreSQL (Basic): ~$12/month
- Container App: ~$10/month
- Log Analytics: ~$0 (minimal usage)
- **Total: ~$22/month**

**Production (if scaled up):**
- PostgreSQL (General Purpose): ~$100/month
- Container App: ~$20/month
- Log Analytics: ~$5/month
- **Total: ~$125/month**

## Post-Deployment Steps

After Terraform creates the infrastructure:

### 1. Run Database Migrations

```bash
# Get database connection info
cd terraform
DB_HOST=$(terraform output -raw db_fqdn)
DB_NAME=$(terraform output -raw db_name)
DB_USER=$(terraform output -raw db_user)
DB_PASSWORD="YOUR_DB_PASSWORD"  # From terraform.tfvars

# Run Flyway migrations
cd ../backend
export FLYWAY_URL="jdbc:postgresql://${DB_HOST}:5432/${DB_NAME}?sslmode=require"
export FLYWAY_USER="$DB_USER"
export FLYWAY_PASSWORD="$DB_PASSWORD"

# If Flyway installed locally:
flyway migrate

# Or using Docker:
docker run --rm \
  -v $(pwd)/migrations:/flyway/sql \
  flyway/flyway:10 \
  -url="jdbc:postgresql://${DB_HOST}:5432/${DB_NAME}?sslmode=require" \
  -user="$DB_USER" \
  -password="$DB_PASSWORD" \
  migrate
```

### 2. Import GeoJSON Data

```bash
# Update backend/scripts/migrate-data.ts with Azure PostgreSQL connection
# Or set environment variables

export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?sslmode=require"

npm run migrate
```

### 3. Verify Deployment

```bash
# Get API URL
API_URL=$(cd terraform && terraform output -raw api_url)

# Test health
curl https://${API_URL}/health | jq

# Test endpoints
curl https://${API_URL}/api/schools | jq '.features | length'
curl https://${API_URL}/api/planning-blocks | jq '.features | length'
curl https://${API_URL}/api/options | jq 'length'
```

### 4. Update Frontend

The frontend will automatically use the backend API if `VITE_API_URL` is set during build. The GitHub Actions workflow handles this automatically.

## Manual Deployment Steps

If you prefer manual control over GitHub Actions:

### 1. Initial Infrastructure Setup

```bash
# Run the automated setup script
./scripts/setup-azure-backend.sh

# This creates ACR and pushes the Docker image
# Then follow prompts to configure terraform.tfvars
```

### 2. Deploy Infrastructure

```bash
cd terraform
terraform init
terraform plan   # Review resources to be created
terraform apply  # Type 'yes' to confirm
```

### 3. Run Migrations

See "Post-Deployment Steps" above.

### 4. Deploy Frontend

```bash
cd ..
npm run build
npx @azure/static-web-apps-cli deploy \
  --deployment-token $(cd terraform && terraform output -raw deployment_token) \
  --app-location dist
```

## Troubleshooting

### Container App Not Starting

```bash
# Check Container App logs
az containerapp logs show \
  --name bcps-redistricting-prod-api \
  --resource-group bcps-redistricting-prod-rg \
  --follow

# Check Container App status
az containerapp show \
  --name bcps-redistricting-prod-api \
  --resource-group bcps-redistricting-prod-rg \
  --query properties.runningStatus
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
DB_HOST=$(cd terraform && terraform output -raw db_fqdn)
psql "postgresql://bcps_admin@${DB_HOST}:5432/bcps_redistricting?sslmode=require"

# Check firewall rules
az postgres flexible-server firewall-rule list \
  --name bcps-redistricting-prod-pg \
  --resource-group bcps-redistricting-prod-rg
```

### Docker Image Not Found

```bash
# Verify image exists in ACR
az acr repository list --name bcpsredistrictingacr

# Check image tags
az acr repository show-tags \
  --name bcpsredistrictingacr \
  --repository redistricting-api
```

## Monitoring

### View Container App Logs

```bash
# Stream live logs
az containerapp logs show \
  --name bcps-redistricting-prod-api \
  --resource-group bcps-redistricting-prod-rg \
  --follow

# Query Log Analytics
WORKSPACE_ID=$(cd terraform && terraform output -raw log_analytics_workspace_id)
az monitor log-analytics query \
  --workspace $WORKSPACE_ID \
  --analytics-query "ContainerAppConsoleLogs_CL | order by TimeGenerated desc | take 100"
```

### Check Database Metrics

```bash
# Database connections
az postgres flexible-server show \
  --name bcps-redistricting-prod-pg \
  --resource-group bcps-redistricting-prod-rg \
  --query "state"

# Storage usage
az postgres flexible-server show \
  --name bcps-redistricting-prod-pg \
  --resource-group bcps-redistricting-prod-rg \
  --query "storage"
```

## Rollback

### Rollback API to Previous Version

```bash
# Get previous image SHA from git history
PREVIOUS_SHA=$(git rev-parse HEAD~1)

# Update Container App
az containerapp update \
  --name bcps-redistricting-prod-api \
  --resource-group bcps-redistricting-prod-rg \
  --image bcpsredistrictingacr.azurecr.io/redistricting-api:$PREVIOUS_SHA
```

### Rollback Database Migrations

```bash
# Connect to database
DB_HOST=$(cd terraform && terraform output -raw db_fqdn)
psql "postgresql://bcps_admin@${DB_HOST}:5432/bcps_redistricting?sslmode=require"

# Check Flyway schema history
SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC;

# Manual rollback (if needed)
# Flyway doesn't support automatic rollback - you'd need to write undo scripts
```

## Next Steps

1. ✅ **Test locally** using `TESTING.md` checklist
2. 🔲 **Run setup script**: `./scripts/setup-azure-backend.sh`
3. 🔲 **Review Terraform plan**: `cd terraform && terraform plan`
4. 🔲 **Deploy infrastructure**: `terraform apply`
5. 🔲 **Run migrations**: Import data to Azure PostgreSQL
6. 🔲 **Verify deployment**: Test API endpoints
7. 🔲 **Enable CI/CD**: Push to master for automatic deployments

## References

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
- [backend/README.md](./backend/README.md) - Backend API documentation
- [TESTING.md](./TESTING.md) - Testing checklist
- [terraform/README.md](./terraform/README.md) - Terraform details
