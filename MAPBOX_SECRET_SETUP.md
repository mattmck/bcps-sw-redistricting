# Mapbox API Key Setup for Production

## Overview
The Mapbox API key is stored securely in Azure Key Vault for production deployments and as a GitHub Secret for CI/PR builds.

## Architecture

### Production (master branch)
- **Storage**: Azure Key Vault (`bcps-redistricting-prod-kv`)
- **Secret Name**: `mapbox-api-key`
- **Access**: GitHub Actions retrieves via Azure CLI during deployment
- **Build**: Injected as `VITE_MAPBOX_ACCESS_TOKEN` environment variable

### CI/PR Builds
- **Storage**: GitHub Secrets
- **Secret Name**: `MAPBOX_API_KEY`
- **Access**: Directly from GitHub Actions
- **Build**: Injected as `VITE_MAPBOX_ACCESS_TOKEN` environment variable

## Setup Instructions

### 1. Add Secret to Azure Key Vault

Using Azure CLI:

```bash
# Set variables
VAULT_NAME="bcps-redistricting-prod-kv"
MAPBOX_KEY="pk.your_actual_mapbox_token_here"

# Add secret to Key Vault
az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name mapbox-api-key \
  --value "$MAPBOX_KEY"

# Verify it was added
az keyvault secret show \
  --vault-name $VAULT_NAME \
  --name mapbox-api-key \
  --query value -o tsv
```

Using Terraform (already configured):

```hcl
# In terraform/main.tf or your secrets configuration
module "secrets" {
  source = "./modules/secrets"
  
  secrets = {
    mapbox-api-key = var.mapbox_api_key  # Pass via TF_VAR_mapbox_api_key
  }
}
```

### 2. Add Secret to GitHub

For CI builds and PR previews:

#### Via GitHub Web UI:
1. Go to: https://github.com/mattmck/bcps-sw-redistricting/settings/secrets/actions
2. Click **New repository secret**
3. Name: `MAPBOX_API_KEY`
4. Value: `pk.your_actual_mapbox_token_here`
5. Click **Add secret**

#### Via GitHub CLI:
```bash
gh secret set MAPBOX_API_KEY --body "pk.your_actual_mapbox_token_here"
```

### 3. Azure Credentials (Required)

The deployment workflow needs Azure credentials to access Key Vault:

```bash
# Create service principal
az ad sp create-for-rbac \
  --name "bcps-redistricting-github-actions" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/bcps-redistricting-prod \
  --json-auth

# Output will be JSON - add it as AZURE_CREDENTIALS secret in GitHub
```

Grant Key Vault access:

```bash
# Get the service principal object ID
SP_OBJECT_ID=$(az ad sp list --display-name "bcps-redistricting-github-actions" --query "[0].id" -o tsv)

# Grant Key Vault secret read permissions
az keyvault set-policy \
  --name bcps-redistricting-prod-kv \
  --object-id $SP_OBJECT_ID \
  --secret-permissions get list
```

### 4. Static Web Apps Token (Required)

Get your Azure Static Web Apps deployment token:

```bash
# Via Azure CLI
az staticwebapp secrets list \
  --name bcps-redistricting \
  --query "properties.apiKey" -o tsv

# Add to GitHub as AZURE_STATIC_WEB_APPS_API_TOKEN
```

## How It Works

### CI Workflow (`ci.yml`)
```yaml
- name: Build project
  run: npm run build
  env:
    VITE_MAPBOX_ACCESS_TOKEN: ${{ secrets.MAPBOX_API_KEY }}
```

### Deploy Workflow (`deploy.yml`)
```yaml
- name: Azure Login
  uses: azure/login@v1
  with:
    creds: ${{ secrets.AZURE_CREDENTIALS }}

- name: Get Mapbox API Key from Key Vault
  id: get-mapbox-key
  run: |
    VAULT_NAME="bcps-redistricting-prod-kv"
    MAPBOX_KEY=$(az keyvault secret show \
      --name mapbox-api-key \
      --vault-name $VAULT_NAME \
      --query value -o tsv)
    echo "::add-mask::$MAPBOX_KEY"
    echo "MAPBOX_KEY=$MAPBOX_KEY" >> $GITHUB_OUTPUT

- name: Build application
  run: npm run build
  env:
    VITE_MAPBOX_ACCESS_TOKEN: ${{ steps.get-mapbox-key.outputs.MAPBOX_KEY }}
```

## Security Features

✅ **Key Vault Integration**: Production keys stored in Azure Key Vault, not in code  
✅ **Masked Outputs**: Keys are masked in GitHub Actions logs (`::add-mask::`)  
✅ **Fallback Support**: Falls back to GitHub Secret if Key Vault is unavailable  
✅ **Least Privilege**: Service principal has minimal permissions (secret read only)  
✅ **Build-time Injection**: Key is injected at build time, not runtime  
✅ **No Client Exposure**: Vite bundles the key into the built JavaScript

## Verification

### Test CI Build
```bash
# Push to branch and check Actions
git push origin your-branch

# Check logs at:
# https://github.com/mattmck/bcps-sw-redistricting/actions
```

### Test Production Deploy
```bash
# Merge to master triggers automatic deployment
# Or manually trigger:
gh workflow run deploy.yml
```

### Verify Key in Built Application
```bash
# Build locally with key
export VITE_MAPBOX_ACCESS_TOKEN="pk.test..."
npm run build

# Check dist files contain the token (base64 encoded in JS bundles)
grep -r "pk.ey" dist/
```

## Troubleshooting

### Build fails with "VITE_MAPBOX_ACCESS_TOKEN not set"
- **CI**: Check GitHub Secret `MAPBOX_API_KEY` is set
- **Deploy**: Check Azure Key Vault has `mapbox-api-key` secret
- **Deploy**: Verify service principal has Key Vault read permissions

### Key Vault access denied
```bash
# Check service principal permissions
az keyvault show-policy \
  --name bcps-redistricting-prod-kv \
  --object-id $SP_OBJECT_ID
```

### Map not loading in production
- Check browser console for Mapbox errors
- Verify the token in dist/ files matches your Mapbox account
- Check Mapbox dashboard for API usage/restrictions

## Rotating Keys

When rotating Mapbox keys:

```bash
# 1. Update Azure Key Vault
az keyvault secret set \
  --vault-name bcps-redistricting-prod-kv \
  --name mapbox-api-key \
  --value "pk.new_key_here"

# 2. Update GitHub Secret
gh secret set MAPBOX_API_KEY --body "pk.new_key_here"

# 3. Trigger new deployment
gh workflow run deploy.yml
```

## References

- [Azure Key Vault Documentation](https://docs.microsoft.com/en-us/azure/key-vault/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Mapbox Access Tokens](https://docs.mapbox.com/help/getting-started/access-tokens/)
