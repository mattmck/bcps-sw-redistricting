# GitHub Secrets Setup for Automated Deployment

This guide covers setting up GitHub secrets for **Option A** (fully automated infrastructure + deployment via GitHub Actions).

## Required Secrets

### Azure Service Principal Credentials

These credentials allow GitHub Actions to authenticate with Azure and manage resources via Terraform.

#### 1. Create Azure Service Principal

```bash
# Login to Azure
az login

# Create service principal with Contributor role
az ad sp create-for-rbac \
  --name "bcps-redistricting-github-actions" \
  --role Contributor \
  --scopes /subscriptions/$(az account show --query id -o tsv) \
  --sdk-auth

# Output will look like:
# {
#   "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
#   "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
#   "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
#   "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
#   ...
# }
```

#### 2. Add Secrets to GitHub

Go to: **GitHub Repository → Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value | Example |
|-------------|-------|---------|
| `AZURE_CLIENT_ID` | `clientId` from service principal output | `a1b2c3d4-...` |
| `AZURE_CLIENT_SECRET` | `clientSecret` from service principal output | `xYz123...` |
| `AZURE_SUBSCRIPTION_ID` | `subscriptionId` from service principal output | `e5f6g7h8-...` |
| `AZURE_TENANT_ID` | `tenantId` from service principal output | `i9j0k1l2-...` |

### Terraform State Storage

Terraform needs a remote backend to store state in Azure Storage.

#### 1. Create Storage Account for Terraform State

```bash
# Set variables
RESOURCE_GROUP="bcps-terraform-state"
LOCATION="eastus"
STORAGE_ACCOUNT="bcpstfstate$(date +%s)"  # Must be globally unique
CONTAINER_NAME="tfstate"

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Create storage account
az storage account create \
  --resource-group $RESOURCE_GROUP \
  --name $STORAGE_ACCOUNT \
  --sku Standard_LRS \
  --encryption-services blob

# Create blob container
az storage container create \
  --name $CONTAINER_NAME \
  --account-name $STORAGE_ACCOUNT

# Save these values!
echo "TERRAFORM_STATE_RG: $RESOURCE_GROUP"
echo "TERRAFORM_STATE_SA: $STORAGE_ACCOUNT"
```

#### 2. Add Terraform State Secrets to GitHub

| Secret Name | Value | Example |
|-------------|-------|---------|
| `TERRAFORM_STATE_RG` | Resource group name | `bcps-terraform-state` |
| `TERRAFORM_STATE_SA` | Storage account name | `bcpstfstate1738540800` |

### Application Secrets

| Secret Name | Value | Notes |
|-------------|-------|-------|
| `DB_ADMIN_PASSWORD` | Strong password (20+ chars) | Used for PostgreSQL admin user |
| `MAPBOX_API_KEY` | Your Mapbox API key | From Mapbox account dashboard |

#### Generate Strong Database Password

```bash
# Generate a random 32-character password
openssl rand -base64 32
```

## Secrets Checklist

Before running automated deployments, ensure all these secrets are set:

- [ ] `AZURE_CLIENT_ID`
- [ ] `AZURE_CLIENT_SECRET`
- [ ] `AZURE_SUBSCRIPTION_ID`
- [ ] `AZURE_TENANT_ID`
- [ ] `TERRAFORM_STATE_RG`
- [ ] `TERRAFORM_STATE_SA`
- [ ] `DB_ADMIN_PASSWORD`
- [ ] `MAPBOX_API_KEY`

## Verify Secrets

You can verify secrets are set (without revealing values) by checking the GitHub UI:

**Repository → Settings → Secrets and variables → Actions**

All 8 secrets should be listed with "Updated X minutes/hours ago" timestamps.

## Security Best Practices

### Service Principal Permissions

The service principal has **Contributor** role, which allows:

- ✅ Create/update/delete Azure resources
- ❌ Manage users, roles, or subscriptions

This follows the **principle of least privilege**.

### Secret Rotation

Rotate secrets periodically:

1. **Azure Service Principal**: Every 90 days

   ```bash
   az ad sp credential reset --id <clientId>
   ```

2. **Database Password**: Every 180 days (update in GitHub + Terraform)

3. **Mapbox API Key**: Only if compromised

### Environment Protection

Consider enabling **GitHub Environment Protection** for production:

1. Go to: **Repository → Settings → Environments → production**
2. Add protection rules:
   - ✅ Required reviewers (1-2 people)
   - ✅ Wait timer (5 minutes for cancel window)
   - ✅ Restrict to `master` branch only

This prevents accidental infrastructure destruction.

## Testing the Setup

### Test 1: Terraform Plan (Dry Run)

Trigger the infrastructure workflow manually:

```bash
# Via GitHub CLI
gh workflow run deploy-infrastructure.yml -f terraform_action=plan
```

Or via GitHub UI:

1. Go to **Actions** tab
2. Select "Deploy Azure Infrastructure (Terraform)"
3. Click "Run workflow"
4. Select `plan` action
5. Click "Run workflow"

This should complete without errors and show what resources would be created.

### Test 2: Full Deployment

Once plan succeeds, run with `apply`:

```bash
gh workflow run deploy-infrastructure.yml -f terraform_action=apply
```

Expected workflow:

1. ✅ Terraform creates Azure resources (5-10 minutes)
2. ✅ Database migrations run automatically
3. ✅ Initial data imported
4. ✅ Trigger `deploy-fullstack.yml` to deploy code

## Troubleshooting

### "Failed to get existing workspaces"

**Problem**: Terraform backend not configured correctly

**Solution**: Double-check `TERRAFORM_STATE_RG` and `TERRAFORM_STATE_SA` match your Azure Storage account:

```bash
az storage account show --name <TERRAFORM_STATE_SA> --resource-group <TERRAFORM_STATE_RG>
```

### "Error: authorization failed"

**Problem**: Service principal doesn't have correct permissions

**Solution**: Re-create service principal with Contributor role:

```bash
az ad sp create-for-rbac \
  --name "bcps-redistricting-github-actions" \
  --role Contributor \
  --scopes /subscriptions/$(az account show --query id -o tsv) \
  --sdk-auth
```

### "Database migration failed"

**Problem**: PostgreSQL firewall blocking GitHub Actions IPs

**Solution**: The Terraform config already includes `allow_azure_services = true`, which should allow GitHub Actions (hosted in Azure). If issues persist, temporarily add:

```hcl
# In terraform/database.tf
resource "azurerm_postgresql_flexible_server_firewall_rule" "github_actions" {
  name             = "AllowGitHubActions"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "255.255.255.255"
}
```

⚠️ **Warning**: This opens the database to all IPs. Only use temporarily for debugging.

## Cost Tracking

All infrastructure created by this automation:

| Resource | Monthly Cost (Dev) | Monthly Cost (Prod) |
|----------|-------------------|---------------------|
| PostgreSQL Flexible Server | ~$12 | ~$45 |
| Container App | ~$8 | ~$50 |
| Log Analytics | ~$2 | ~$10 |
| Container Registry | ~$5 | ~$5 |
| Static Web App | Free | Free |
| **Total** | **~$27/month** | **~$110/month** |

Set up Azure Cost Alerts:

```bash
az consumption budget create \
  --budget-name bcps-redistricting-budget \
  --amount 50 \
  --time-grain Monthly \
  --start-date $(date +%Y-%m-01) \
  --resource-group bcps-redistricting-rg
```

## Related Documentation

- [DEPLOYMENT.md](../DEPLOYMENT.md) - Full-stack deployment guide
- [DEPLOYMENT_FRONTEND_ONLY.md](../DEPLOYMENT_FRONTEND_ONLY.md) - Frontend-only deployment
- [terraform/README.md](../terraform/README.md) - Terraform infrastructure guide
- [.github/workflows/deploy-infrastructure.yml](../.github/workflows/deploy-infrastructure.yml) - Automated workflow
- [.github/workflows/deploy-fullstack.yml](../.github/workflows/deploy-fullstack.yml) - Application deployment
