# Secrets Management Guide

This guide covers managing secrets (API keys, tokens) for the BCPS Redistricting Tool in a cloud-agnostic manner.

## Overview

Secrets like the Mapbox API key are:
- **Never committed to git** - Excluded via `.gitignore`
- **Stored in `.env.local`** for local development
- **Stored in cloud secrets manager** for production deployments
- **Retrieved at build time** from the appropriate source

## Current Setup

**Mapbox API Key**: `***REMOVED***`

This production key is:
- Used in `.env.local` for local development
- Stored in Azure Key Vault for production builds
- Managed via Terraform in `terraform/modules/secrets/`

## Local Development

### Setup

1. The `.env.local` file already contains the Mapbox API key
2. Vite automatically loads this file during `npm run dev`
3. The key is available as `import.meta.env.VITE_MAPBOX_ACCESS_TOKEN`

### Verify

```bash
# Start dev server
npm run dev

# Open browser console - check for Mapbox errors
# Should see map loading without API key issues
```

## Production Deployment

### Cloud-Agnostic Architecture

The secrets module (`terraform/modules/secrets/`) provides a consistent interface across cloud providers:

```
Application Build
       ↓
Retrieve Secret from Cloud Secrets Manager
       ↓
Build with Secret as Environment Variable
       ↓
Deploy Static Assets (secret embedded in JS bundle)
```

### Azure Key Vault (Current)

Secrets are stored in Azure Key Vault and retrieved during build.

#### Deploy Infrastructure with Secrets

```bash
cd terraform
terraform init
terraform apply
```

This creates:
- Azure Key Vault: `bcps-redistricting-prod-kv`
- Secret: `mapbox-api-key` with the production key

#### Retrieve Secrets Manually

```bash
# Get vault name
VAULT_NAME=$(cd terraform && terraform output -raw key_vault_name)

# Retrieve Mapbox key
az keyvault secret show \
  --name mapbox-api-key \
  --vault-name $VAULT_NAME \
  --query value -o tsv
```

#### Build with Secrets

The `deploy.sh` script automatically retrieves secrets:

```bash
./deploy.sh --deploy-only
```

Manually:
```bash
# Retrieve key
MAPBOX_KEY=$(az keyvault secret show \
  --name mapbox-api-key \
  --vault-name bcps-redistricting-prod-kv \
  --query value -o tsv)

# Build with key
VITE_MAPBOX_ACCESS_TOKEN=$MAPBOX_KEY npm run build

# Deploy
npx @azure/static-web-apps-cli deploy \
  --app-location ./dist \
  --deployment-token $(cd terraform && terraform output -raw deployment_token)
```

### GitHub Actions (CI/CD)

The workflow automatically retrieves secrets from Key Vault:

#### Setup

1. **Create Azure Service Principal**:
   ```bash
   az ad sp create-for-rbac \
     --name "bcps-redistricting-github" \
     --role contributor \
     --scopes /subscriptions/<subscription-id>/resourceGroups/bcps-redistricting-prod-rg \
     --sdk-auth
   ```

2. **Add to GitHub Secrets**:
   - Go to repository Settings → Secrets → Actions
   - Add `AZURE_CREDENTIALS` with the JSON output from above
   - Add `AZURE_STATIC_WEB_APPS_API_TOKEN` from `terraform output -raw deployment_token`

3. **Deploy infrastructure first**:
   ```bash
   cd terraform
   terraform apply
   ```

4. **Push to master** - GitHub Actions will:
   - Login to Azure
   - Retrieve Mapbox key from Key Vault
   - Build app with the key
   - Deploy to Azure Static Web Apps

## AWS Secrets Manager (Alternative)

To use AWS instead of Azure:

### 1. Update Secrets Module

Replace `terraform/modules/secrets/main.tf`:

```hcl
# AWS Secrets Manager implementation
resource "aws_secretsmanager_secret" "secrets" {
  for_each = var.secrets
  name     = "${var.app_name}-${var.environment}-${each.key}"
  tags     = var.tags
}

resource "aws_secretsmanager_secret_version" "secrets" {
  for_each      = var.secrets
  secret_id     = aws_secretsmanager_secret.secrets[each.key].id
  secret_string = each.value
}
```

### 2. Update deploy.sh

```bash
# Retrieve from AWS
MAPBOX_KEY=$(aws secretsmanager get-secret-value \
  --secret-id bcps-redistricting-prod-mapbox-api-key \
  --query SecretString \
  --output text)

VITE_MAPBOX_ACCESS_TOKEN=$MAPBOX_KEY npm run build
```

### 3. Update GitHub Actions

```yaml
- name: Configure AWS Credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: us-east-1

- name: Get Mapbox Key
  run: |
    MAPBOX_KEY=$(aws secretsmanager get-secret-value \
      --secret-id bcps-redistricting-prod-mapbox-api-key \
      --query SecretString \
      --output text)
    echo "::add-mask::$MAPBOX_KEY"
    echo "MAPBOX_KEY=$MAPBOX_KEY" >> $GITHUB_OUTPUT
```

## GCP Secret Manager (Alternative)

To use GCP:

### 1. Update Secrets Module

Replace `terraform/modules/secrets/main.tf`:

```hcl
# GCP Secret Manager implementation
resource "google_secret_manager_secret" "secrets" {
  for_each  = var.secrets
  secret_id = "${var.app_name}-${var.environment}-${each.key}"
  
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "secrets" {
  for_each    = var.secrets
  secret      = google_secret_manager_secret.secrets[each.key].id
  secret_data = each.value
}
```

### 2. Update deploy.sh

```bash
# Retrieve from GCP
MAPBOX_KEY=$(gcloud secrets versions access latest \
  --secret=bcps-redistricting-prod-mapbox-api-key)

VITE_MAPBOX_ACCESS_TOKEN=$MAPBOX_KEY npm run build
```

### 3. Update GitHub Actions

```yaml
- name: Authenticate to GCP
  uses: google-github-actions/auth@v2
  with:
    credentials_json: ${{ secrets.GCP_CREDENTIALS }}

- name: Get Mapbox Key
  run: |
    MAPBOX_KEY=$(gcloud secrets versions access latest \
      --secret=bcps-redistricting-prod-mapbox-api-key)
    echo "::add-mask::$MAPBOX_KEY"
    echo "MAPBOX_KEY=$MAPBOX_KEY" >> $GITHUB_OUTPUT
```

## Rotating Secrets

### Update Mapbox API Key

1. **Generate new key** in Mapbox dashboard
2. **Update in secrets manager**:

   ```bash
   # Azure
   az keyvault secret set \
     --vault-name bcps-redistricting-prod-kv \
     --name mapbox-api-key \
     --value "NEW_KEY_HERE"
   
   # AWS
   aws secretsmanager update-secret \
     --secret-id bcps-redistricting-prod-mapbox-api-key \
     --secret-string "NEW_KEY_HERE"
   
   # GCP
   echo -n "NEW_KEY_HERE" | gcloud secrets versions add \
     bcps-redistricting-prod-mapbox-api-key --data-file=-
   ```

3. **Update `.env.local`** for local development:
   ```bash
   # Edit .env.local
   VITE_MAPBOX_ACCESS_TOKEN=NEW_KEY_HERE
   ```

4. **Rebuild and deploy**:
   ```bash
   ./deploy.sh --deploy-only
   ```

## Security Best Practices

### 1. Domain Restrictions

Restrict the Mapbox API key in Mapbox dashboard:
- Login to https://account.mapbox.com/
- Go to Access Tokens
- Click on the token
- Add URL restrictions:
  - `https://bcps-redistricting-prod-swa.azurestaticapps.net`
  - `https://your-custom-domain.org` (if using custom domain)
  - `http://localhost:3000` (for local development)

### 2. Rate Limiting

Enable rate limits in Mapbox dashboard to prevent abuse.

### 3. Separate Keys per Environment

Use different Mapbox keys for dev/staging/prod:

```bash
# terraform/terraform.tfvars
mapbox_api_key = "pk.prod_key_here"  # Production

# Create separate deployments
terraform workspace new dev
terraform apply -var="mapbox_api_key=pk.dev_key_here"
```

### 4. Access Control

Restrict who can read secrets:

**Azure**:
```bash
# Grant read access to specific user
az keyvault set-policy \
  --name bcps-redistricting-prod-kv \
  --upn user@example.com \
  --secret-permissions get list
```

**AWS**:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["secretsmanager:GetSecretValue"],
    "Resource": "arn:aws:secretsmanager:region:account:secret:*"
  }]
}
```

**GCP**:
```bash
gcloud secrets add-iam-policy-binding \
  bcps-redistricting-prod-mapbox-api-key \
  --member="user:user@example.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 5. Audit Logging

Enable audit logs to track secret access:

**Azure**: Enabled by default in Key Vault diagnostics
**AWS**: Enable CloudTrail
**GCP**: Enable Audit Logs in Cloud Logging

## Troubleshooting

### Issue: Map not loading in production

**Symptom**: Blank map or "Invalid token" error in console

**Solutions**:
1. Verify secret is in Key Vault:
   ```bash
   az keyvault secret show \
     --name mapbox-api-key \
     --vault-name bcps-redistricting-prod-kv
   ```

2. Check build logs for secret retrieval:
   ```bash
   # In GitHub Actions logs, look for:
   # "✅ Mapbox API key retrieved from Key Vault"
   ```

3. Verify key is valid in Mapbox dashboard

4. Check domain restrictions on the key

### Issue: Access denied to Key Vault

**Symptom**: `az keyvault secret show` fails with permission error

**Solutions**:
1. Grant yourself access:
   ```bash
   az keyvault set-policy \
     --name bcps-redistricting-prod-kv \
     --upn your-email@example.com \
     --secret-permissions get list
   ```

2. For GitHub Actions, verify service principal has access:
   ```bash
   az keyvault set-policy \
     --name bcps-redistricting-prod-kv \
     --spn <service-principal-id> \
     --secret-permissions get
   ```

### Issue: Build uses wrong key

**Symptom**: Local key works but production doesn't (or vice versa)

**Solutions**:
1. Check which key is being used:
   ```bash
   # In build logs, check:
   echo "Using key: ${VITE_MAPBOX_ACCESS_TOKEN:0:20}..."
   ```

2. Verify `.env.local` is gitignored
3. Ensure secrets manager has correct key
4. Clear build cache: `rm -rf dist/ node_modules/.vite`

## References

- [Azure Key Vault Documentation](https://docs.microsoft.com/en-us/azure/key-vault/)
- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [GCP Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [Mapbox Access Tokens](https://docs.mapbox.com/help/getting-started/access-tokens/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

## License

This secrets management configuration is part of the BCPS Redistricting Tool project.
