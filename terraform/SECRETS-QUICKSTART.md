# Secrets Management Quick Start

## Current Setup

**Mapbox API Key (Production)**: 
```
***REMOVED***
```

This key is:
✅ Already in `.env.local` for local development  
✅ Configured in `terraform/variables.tf` with default value  
✅ Will be stored in Azure Key Vault on deployment  
✅ Retrieved automatically by `deploy.sh` and GitHub Actions  

## Architecture Flow

```
┌─────────────────────────────────────────────────┐
│          Local Development                       │
│  .env.local → Vite → MainView.tsx               │
│  (gitignored)                                    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│          Production Deployment                   │
│                                                   │
│  1. Terraform creates Azure Key Vault           │
│     └─ Stores: mapbox-api-key                   │
│                                                   │
│  2. Build Process                                │
│     ├─ Retrieve from Key Vault                  │
│     ├─ Set VITE_MAPBOX_ACCESS_TOKEN             │
│     └─ npm run build                             │
│                                                   │
│  3. Static Assets                                │
│     └─ dist/ (with embedded key in JS)          │
│                                                   │
│  4. Azure Static Web Apps                        │
│     └─ Serves bundled app                       │
└─────────────────────────────────────────────────┘
```

## Quick Commands

### Deploy with Secrets
```bash
# Full deployment (creates Key Vault + stores secret)
./deploy.sh

# Deploy app only (retrieves from Key Vault)
./deploy.sh --deploy-only
```

### Manual Secret Retrieval
```bash
# Get Key Vault name
terraform output -raw key_vault_name

# Get Mapbox key
az keyvault secret show \
  --name mapbox-api-key \
  --vault-name bcps-redistricting-prod-kv \
  --query value -o tsv
```

### Update Secret
```bash
# Update in Key Vault
az keyvault secret set \
  --vault-name bcps-redistricting-prod-kv \
  --name mapbox-api-key \
  --value "NEW_KEY_HERE"

# Update locally
# Edit .env.local manually

# Rebuild and deploy
./deploy.sh --deploy-only
```

## Cloud-Agnostic Design

The secrets module (`modules/secrets/`) uses a consistent interface:

**Inputs:**
- `secrets` - Map of secret names to values
- `app_name`, `environment`, `location` - Naming/location

**Outputs:**
- `vault_name` - Name of secrets vault
- `vault_uri` - URI to access vault
- `secret_names` - List of stored secrets

**Swap providers by replacing `modules/secrets/main.tf`:**
- Azure Key Vault (current) ✅
- AWS Secrets Manager (alternative)
- GCP Secret Manager (alternative)

## Verification

### Check local setup:
```bash
# Should show the production key
cat .env.local | grep VITE_MAPBOX_ACCESS_TOKEN

# Should load map without errors
npm run dev
```

### Check production setup:
```bash
# After terraform apply
terraform output key_vault_name  # Should show vault name

# Verify secret exists
az keyvault secret show \
  --name mapbox-api-key \
  --vault-name $(terraform output -raw key_vault_name)
```

## Security Checklist

- [x] `.env.local` is gitignored
- [x] Production key stored in Key Vault
- [ ] Domain restrictions set in Mapbox dashboard
- [ ] Rate limiting enabled in Mapbox dashboard
- [ ] Key Vault access restricted to required users/services
- [ ] Separate keys for dev/staging/prod environments (optional)

## Troubleshooting

**Map not loading?**
→ Check console for API key errors
→ Verify key in `.env.local` (local) or Key Vault (prod)
→ Check domain restrictions in Mapbox dashboard

**Can't access Key Vault?**
→ Grant yourself access: `az keyvault set-policy --name <vault> --upn <email> --secret-permissions get list`

**Build using wrong key?**
→ Check which key is loaded: Add `console.log(import.meta.env.VITE_MAPBOX_ACCESS_TOKEN.substring(0,20))` temporarily

## Full Documentation

See [SECRETS.md](../SECRETS.md) for:
- Complete setup instructions
- AWS and GCP alternatives
- Security best practices
- CI/CD integration
- Key rotation procedures
