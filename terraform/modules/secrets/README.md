# Secrets Management Module (Cloud-Agnostic)

This module provides cloud-agnostic secret storage and retrieval. The implementation uses Azure Key Vault but is designed to be easily swapped with AWS Secrets Manager or GCP Secret Manager.

## Purpose

Stores sensitive configuration values like API keys that should not be embedded in code or version control.

## Usage

```hcl
module "secrets" {
  source = "./modules/secrets"
  
  app_name    = "bcps-redistricting"
  environment = "prod"
  location    = "eastus"
  
  secrets = {
    mapbox-api-key = "***REMOVED***"
  }
  
  tags = {
    Project = "BCPS Redistricting"
  }
}
```

## Retrieving Secrets at Build Time

### Option 1: GitHub Actions (Recommended)

```yaml
- name: Get Mapbox API Key
  uses: azure/get-keyvault-secrets@v1
  with:
    keyvault: ${{ secrets.AZURE_KEYVAULT_NAME }}
    secrets: 'mapbox-api-key'
  id: mapbox-secret

- name: Build with secrets
  run: npm run build
  env:
    VITE_MAPBOX_ACCESS_TOKEN: ${{ steps.mapbox-secret.outputs.mapbox-api-key }}
```

### Option 2: Azure CLI

```bash
# Retrieve secret
MAPBOX_KEY=$(az keyvault secret show \
  --name mapbox-api-key \
  --vault-name <vault-name> \
  --query value -o tsv)

# Build with secret
VITE_MAPBOX_ACCESS_TOKEN=$MAPBOX_KEY npm run build
```

### Option 3: Terraform Output (for deployment scripts)

```bash
# In deploy.sh
MAPBOX_KEY=$(cd terraform && terraform output -raw mapbox_api_key)
export VITE_MAPBOX_ACCESS_TOKEN=$MAPBOX_KEY
npm run build
```

## Cloud Provider Equivalents

### Current: Azure Key Vault
- Encrypted storage with RBAC
- Automatic key rotation support
- Audit logging

### AWS: Secrets Manager
```hcl
resource "aws_secretsmanager_secret" "mapbox" {
  name = "mapbox-api-key"
}

resource "aws_secretsmanager_secret_version" "mapbox" {
  secret_id     = aws_secretsmanager_secret.mapbox.id
  secret_string = var.mapbox_api_key
}
```

Retrieve with:
```bash
aws secretsmanager get-secret-value \
  --secret-id mapbox-api-key \
  --query SecretString \
  --output text
```

### GCP: Secret Manager
```hcl
resource "google_secret_manager_secret" "mapbox" {
  secret_id = "mapbox-api-key"
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "mapbox" {
  secret      = google_secret_manager_secret.mapbox.id
  secret_data = var.mapbox_api_key
}
```

Retrieve with:
```bash
gcloud secrets versions access latest \
  --secret=mapbox-api-key
```

## Security Best Practices

1. **Never commit secrets to git** - Use `.env.local` locally, secrets manager in production
2. **Restrict access** - Use IAM/RBAC to limit who can read secrets
3. **Rotate regularly** - Update API keys periodically
4. **Domain restrictions** - Configure Mapbox dashboard to restrict key usage to your domains
5. **Separate environments** - Use different keys for dev/staging/prod

## Module Interface

### Inputs
- `app_name` - Application name
- `environment` - Environment (dev/staging/prod)
- `location` - Cloud region
- `secrets` - Map of secret names to values
- `tags` - Resource tags

### Outputs
- `vault_name` - Name of the secrets vault
- `vault_uri` - URI to access the vault
- `secret_names` - List of stored secret names
