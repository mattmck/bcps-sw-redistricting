# BCPS Redistricting Tool - Azure Deployment Guide

This guide covers deploying the BCPS School Redistricting Tool to Azure using Terraform in a cloud-agnostic way.

## Overview

**Infrastructure**: Azure Static Web Apps (cloud-agnostic abstraction)  
**IaC Tool**: Terraform >= 1.0  
**CI/CD**: GitHub Actions (optional)  
**Cost**: Free tier available (100 GB bandwidth/month)

## Quick Start

### Option 1: Automated Script (Recommended)

```bash
# Full deployment (infrastructure + app)
./deploy.sh

# Deploy app only (after infrastructure exists)
./deploy.sh --deploy-only

# Deploy infrastructure only
./deploy.sh --infra-only
```

### Option 2: Manual Steps

```bash
# 1. Login to Azure
az login

# 2. Initialize Terraform
cd terraform
terraform init

# 3. Configure deployment
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your settings

# 4. Deploy infrastructure
terraform plan -out=tfplan
terraform apply tfplan

# 5. Build app
cd ..
npm install
npm run build

# 6. Deploy app
DEPLOYMENT_TOKEN=$(cd terraform && terraform output -raw deployment_token)
npx @azure/static-web-apps-cli deploy \
  --app-location ./dist \
  --deployment-token "$DEPLOYMENT_TOKEN"

# 7. Get app URL
cd terraform && terraform output application_url
```

## Prerequisites

### Required Tools

1. **Azure CLI** (for authentication)
   ```bash
   # macOS
   brew install azure-cli
   
   # Windows
   winget install Microsoft.AzureCLI
   
   # Linux
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   ```

2. **Terraform** >= 1.0
   ```bash
   # macOS
   brew install terraform
   
   # Windows
   winget install Hashicorp.Terraform
   
   # Linux
   wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
   echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
   sudo apt update && sudo apt install terraform
   ```

3. **Node.js** >= 18
   ```bash
   # macOS
   brew install node
   
   # Windows
   winget install OpenJS.NodeJS
   
   # Linux (via nvm)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   ```

### Azure Setup

1. **Azure Subscription**: You need an active Azure subscription
   - Free tier: https://azure.microsoft.com/free/

2. **Permissions**: Your account needs:
   - Contributor role on the subscription (or)
   - Permission to create resource groups and Static Web Apps

## Configuration

### terraform.tfvars

Create `terraform/terraform.tfvars` from the example:

```hcl
project_name = "bcps-redistricting"
environment  = "prod"
location     = "eastus"  # Choose closest region
sku_tier     = "Free"    # or "Standard" ($9/month)

# Required: Mapbox API key (get from https://account.mapbox.com/access-tokens/)
mapbox_api_key = "YOUR_MAPBOX_API_KEY_HERE"

# Optional: Custom domain
# custom_domain = "redistricting.yourschool.org"

# Optional: Custom tags
tags = {
  Project     = "BCPS Redistricting"
  Department  = "IT"
  Owner       = "your-email@example.com"
}
```

**Important**: The `terraform.tfvars` file is gitignored and will not be committed. The Mapbox API key will be stored securely in Azure Key Vault.

### Available Regions

Choose a region close to your users:
- `eastus` - US East (Virginia)
- `eastus2` - US East 2 (Virginia)
- `centralus` - US Central (Iowa)
- `westus2` - US West 2 (Washington)
- `westeurope` - West Europe (Netherlands)
- `eastasia` - East Asia (Hong Kong)

Full list: https://azure.microsoft.com/en-us/explore/global-infrastructure/geographies/

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Users                           │
└─────────────────┬───────────────────────────────┘
                  │ HTTPS
                  ▼
┌─────────────────────────────────────────────────┐
│     Azure Static Web Apps (with CDN)            │
│  ┌───────────────────────────────────────────┐  │
│  │  React SPA (Vite Build)                   │  │
│  │  - HTML, JS, CSS                          │  │
│  │  - GeoJSON data files                     │  │
│  │  - Mapbox GL integration                  │  │
│  └───────────────────────────────────────────┘  │
│                                                   │
│  Features:                                        │
│  - Global CDN                                     │
│  - Auto SSL (Let's Encrypt)                      │
│  - Custom domains                                 │
│  - Preview URLs for PRs                          │
└─────────────────────────────────────────────────┘
```

### Cloud-Agnostic Design

The Terraform configuration uses cloud-agnostic patterns:

**Current: Azure**
- `azurerm_static_web_app` - Managed static hosting with CDN

**Equivalent: AWS**
- `aws_s3_bucket` - Static file storage
- `aws_cloudfront_distribution` - Global CDN
- `aws_acm_certificate` - SSL certificate
- `aws_route53_record` - DNS management

**Equivalent: GCP**
- `google_storage_bucket` - Static file storage
- `google_compute_backend_bucket` - CDN integration
- `google_compute_url_map` - Load balancing
- `google_dns_record_set` - DNS management

The module structure in `terraform/modules/static-hosting/` provides a consistent interface that can be swapped between providers.

## Deployment Workflows

### Development Workflow

```bash
# Make code changes
git checkout -b feature/my-changes

# Test locally
npm run dev

# Build and deploy to preview
npm run build
./deploy.sh --deploy-only

# Verify changes
# Get preview URL from output

# Merge to master for production deployment
```

### CI/CD with GitHub Actions

The included `.github/workflows/deploy.yml` automatically:
1. Builds the app on every push to `master`
2. Deploys to Azure Static Web Apps
3. Creates preview URLs for pull requests
4. Cleans up preview environments when PRs close

**Setup**:
1. Deploy infrastructure once: `cd terraform && terraform apply`
2. Get deployment token: `terraform output -raw deployment_token`
3. Add to GitHub Secrets as `AZURE_STATIC_WEB_APPS_API_TOKEN`
4. Push to master - automatic deployments!

## Cost Breakdown

### Free Tier (Default)
- **Hosting**: 100 GB bandwidth/month
- **Storage**: 0.5 GB
- **Custom domains**: 2 domains
- **SSL**: Automatic, included
- **Preview URLs**: 3 staging environments
- **Cost**: $0/month

### Standard Tier
- **Hosting**: Unlimited bandwidth
- **Storage**: 2 GB
- **Custom domains**: Unlimited
- **SSL**: Automatic, included
- **Preview URLs**: 10 staging environments
- **SLA**: 99.95% uptime guarantee
- **Cost**: ~$9/month

> For this project (mostly static GeoJSON files), the Free tier is sufficient for moderate traffic.

## Custom Domain Setup

### 1. Add Domain to Terraform

Edit `terraform/terraform.tfvars`:
```hcl
custom_domain = "redistricting.yourschool.org"
```

Apply changes:
```bash
cd terraform
terraform apply
```

### 2. Configure DNS

Add a CNAME record in your DNS provider:

```
Type:  CNAME
Name:  redistricting
Value: <hostname from terraform output>
TTL:   3600
```

Example:
```
redistricting.yourschool.org → bcps-redistricting-prod-swa.azurestaticapps.net
```

### 3. Wait for Validation

Azure will automatically provision an SSL certificate. This takes 5-15 minutes.

Check status:
```bash
az staticwebapp show \
  --name $(cd terraform && terraform output -raw static_web_app_name) \
  --resource-group $(cd terraform && terraform output -raw resource_group_name) \
  --query customDomains
```

## Updating the Application

### Code Changes Only

```bash
# Make changes, test locally
npm run dev

# Build and deploy
npm run build
./deploy.sh --deploy-only
```

### Infrastructure Changes

```bash
# Edit terraform/*.tf files
cd terraform

# Plan changes
terraform plan

# Apply changes
terraform apply
```

## Monitoring & Troubleshooting

### View Application Logs

```bash
az monitor activity-log list \
  --resource-group $(cd terraform && terraform output -raw resource_group_name) \
  --output table
```

### Check Build Status

Visit Azure Portal:
1. Go to resource group
2. Click on Static Web App
3. Check "Deployments" section

### Common Issues

**Issue**: Build succeeds but app shows blank page
- **Cause**: Mapbox API key not configured or invalid
- **Solution**: Check console for errors, verify Mapbox key in code

**Issue**: 404 errors for routes
- **Cause**: Static Web App not configured for SPA routing
- **Solution**: Add `staticwebapp.config.json` (already included)

**Issue**: Large GeoJSON files load slowly
- **Cause**: Files served without compression
- **Solution**: Azure Static Web Apps automatically compresses; check browser network tab

### Rollback

If deployment fails or has issues:

```bash
# Option 1: Redeploy previous version
git checkout <previous-commit>
npm run build
./deploy.sh --deploy-only

# Option 2: Destroy and recreate
cd terraform
terraform destroy
terraform apply
```

## Security Considerations

### Mapbox API Key

The Mapbox API key is embedded in the client-side code. Protect it:

1. **URL Restrictions**: In Mapbox dashboard, restrict key to your domain
   - Add: `https://your-app.azurestaticapps.net`
   - Add: `https://redistricting.yourschool.org` (if using custom domain)

2. **Rate Limiting**: Enable rate limits in Mapbox dashboard

3. **Separate Keys**: Use different keys for dev/staging/prod

### Terraform State

The Terraform state file contains sensitive data (deployment tokens).

**For Production**:
1. Use remote backend (Azure Storage)
2. Enable encryption at rest
3. Restrict access with Azure RBAC

Edit `terraform/main.tf`:
```hcl
terraform {
  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfstate<unique>"
    container_name       = "tfstate"
    key                  = "redistricting.terraform.tfstate"
  }
}
```

Create backend storage:
```bash
# Create resource group
az group create --name terraform-state-rg --location eastus

# Create storage account
az storage account create \
  --name tfstate$(uuidgen | tr -d '-' | tr '[:upper:]' '[:lower:]' | cut -c1-10) \
  --resource-group terraform-state-rg \
  --location eastus \
  --sku Standard_LRS \
  --encryption-services blob

# Create container
az storage container create \
  --name tfstate \
  --account-name <storage-account-name>
```

## Cleanup

### Remove Application (Keep Infrastructure)

The application can be removed from Azure Static Web Apps, but the infrastructure remains:
- Use for maintenance windows
- Reduces costs temporarily

```bash
# No direct "remove app" command - redeploy empty dist/ to effectively clear
```

### Destroy All Infrastructure

**Warning**: This deletes everything and cannot be undone!

```bash
cd terraform
terraform destroy
```

You'll be prompted to confirm. Type `yes` to proceed.

Cost: $0 after destruction (free tier has no residual costs)

## Multi-Environment Setup

To deploy multiple environments (dev, staging, prod):

### Option 1: Separate State Files

```bash
# Dev
cd terraform
terraform workspace new dev
terraform apply -var="environment=dev" -var="sku_tier=Free"

# Staging
terraform workspace new staging
terraform apply -var="environment=staging" -var="sku_tier=Free"

# Prod
terraform workspace new prod
terraform apply -var="environment=prod" -var="sku_tier=Standard"
```

### Option 2: Separate Directories

```
terraform/
├── dev/
│   ├── main.tf
│   └── terraform.tfvars
├── staging/
│   ├── main.tf
│   └── terraform.tfvars
└── prod/
    ├── main.tf
    └── terraform.tfvars
```

## Secrets Management

The Mapbox API key and other secrets are managed securely:
- **Local development**: Stored in `.env.local` (gitignored)
- **Production**: Stored in Azure Key Vault
- **CI/CD**: Retrieved automatically during build

See [SECRETS.md](./SECRETS.md) for complete secrets management documentation, including:
- How to update API keys
- Cloud-agnostic alternatives (AWS Secrets Manager, GCP Secret Manager)
- Security best practices
- Troubleshooting

## Additional Resources

- [Azure Static Web Apps Docs](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Vite Build Configuration](https://vitejs.dev/guide/build.html)
- [Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js/)
- [Secrets Management Guide](./SECRETS.md)
- [Project README](./README.md)
- [Developer Instructions](./INSTRUCTIONS.md)

## Support

For issues:
1. Check the troubleshooting section above
2. Review Azure Static Web Apps logs in Azure Portal
3. Check GitHub Actions logs (if using CI/CD)
4. Review Terraform plan/apply output for infrastructure issues

## License

This deployment configuration is part of the BCPS Redistricting Tool project.
