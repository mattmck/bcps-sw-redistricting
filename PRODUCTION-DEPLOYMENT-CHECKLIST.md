# Production Deployment Checklist

This checklist guides you through deploying the BCPS Redistricting Tool to Azure production.

## Branch Information

**Current Branch**: `48-feature-database-backend-with-postgis-for-spatial-data`  
**Base Branch**: `master`  
**Created**: 2026-02-02

**Note**: This checklist covers both frontend-only and full-stack deployment options.

## Pre-Deployment Checklist

### 1. Prerequisites Installed

- [ ] **Azure CLI** installed and updated

  ```bash
  az --version  # Should be 2.0 or higher
  az login
  ```

- [ ] **Terraform** installed (>= 1.0)

  ```bash
  terraform --version
  ```

- [ ] **Node.js** >= 18

  ```bash
  node --version
  ```

### 2. Azure Setup

- [ ] **Azure subscription** active and accessible

  ```bash
  az account show
  ```

- [ ] **Permissions verified** - You need Contributor role or ability to create:
  - Resource Groups
  - Static Web Apps
  - Key Vaults

### 3. Configuration Review

- [ ] **Review Terraform variables** in `terraform/terraform.tfvars.example`
  - Project name: `bcps-redistricting`
  - Environment: `prod`
  - Location: Choose closest to users (default: `eastus`)
  - SKU tier: `Free` or `Standard`

- [ ] **Mapbox API key** verified
  - Key is set in `.env.local`: ✅
  - Key will be stored in Azure Key Vault: ✅
  - Domain restrictions will be configured after deployment

### 4. Documentation Review

- [ ] Read [DEPLOYMENT.md](./DEPLOYMENT.md) - Main deployment guide
- [ ] Read [SECRETS.md](./SECRETS.md) - Secrets management
- [ ] Read [terraform/README.md](./terraform/README.md) - Terraform details

## Deployment Steps

### Phase 1: Local Testing (5 minutes)

1. **Test local build**

   ```bash
   npm install
   npm run build
   ```

   Expected: Build succeeds, `dist/` directory created

2. **Test local development**

   ```bash
   npm run dev
   ```

   Expected: Map loads with planning blocks and schools, no console errors

3. **Verify Mapbox key**
   - Open browser console
   - Check for "Invalid token" errors (should be none)
   - Verify map tiles load correctly

**Status**: [ ] Passed | [ ] Failed

---

### Phase 2: Infrastructure Deployment (10-15 minutes)

1. **Initialize Terraform**

   ```bash
   cd terraform
   terraform init
   ```

   Expected: Provider plugins downloaded successfully

2. **Create configuration file**

   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars if needed (or use defaults)
   ```

3. **Plan infrastructure**

   ```bash
   terraform plan -out=tfplan
   ```

   Expected: Shows resources to be created:
   - Resource Group
   - Static Web App
   - Key Vault (if enabled)

4. **Review plan**
   - [ ] Resource names look correct
   - [ ] Region is appropriate
   - [ ] No unexpected deletions or changes

5. **Apply infrastructure**

   ```bash
   terraform apply tfplan
   ```

   Expected: Resources created successfully
   
   Time: ~5-10 minutes

6. **Verify outputs**

   ```bash
   terraform output
   ```

   Expected outputs:
   - `application_url` - Your app URL
   - `key_vault_name` - Key Vault name (if enabled)
   - `deployment_token` - Deployment token (sensitive)

**Status**: [ ] Passed | [ ] Failed

**Application URL**: ________________________________

**Key Vault Name**: ________________________________

---

### Phase 3: Application Deployment (5 minutes)

1. **Option A: Automated Script (Recommended)**

   ```bash
   cd ..
   ./deploy.sh --deploy-only
   ```

2. **Option B: Manual Deployment**

   ```bash
   # Get deployment token
   DEPLOYMENT_TOKEN=$(cd terraform && terraform output -raw deployment_token)
   
   # Get Mapbox key from Key Vault (optional)
   VAULT_NAME=$(cd terraform && terraform output -raw key_vault_name)
   MAPBOX_KEY=$(az keyvault secret show \
     --name mapbox-api-key \
     --vault-name $VAULT_NAME \
     --query value -o tsv)
   
   # Build with Mapbox key
   VITE_MAPBOX_ACCESS_TOKEN=$MAPBOX_KEY npm run build
   
   # Deploy
   npx @azure/static-web-apps-cli deploy \
     --app-location ./dist \
     --deployment-token "$DEPLOYMENT_TOKEN"
   ```

3. **Verify deployment**

   ```bash
   # Get app URL
   cd terraform
   terraform output application_url
   ```

**Status**: [ ] Passed | [ ] Failed

---

### Phase 4: Production Verification (5 minutes)

Open the application URL and verify:

- [ ] **Map loads** without errors
- [ ] **Schools appear** as colored circles
- [ ] **Planning blocks render** with gray fill
- [ ] **School selection works** - Click a school, banner shows
- [ ] **Block reassignment works** - Click planning block after selecting school
- [ ] **Data table displays** with school information
- [ ] **Options dropdown** shows all 33 redistricting options
- [ ] **Console has no errors** - Open browser DevTools
- [ ] **Mobile responsive** - Test on phone or resize browser

**Issues Found**: ________________________________

**Status**: [ ] Passed | [ ] Failed

---

### Phase 5: Security Configuration (10 minutes)

1. **Configure Mapbox API Key Restrictions**
   - [ ] Login to https://account.mapbox.com/
   - [ ] Go to Access Tokens
   - [ ] Click on your production token
   - [ ] Add URL restrictions:

     ```
     https://<your-static-app-url>.azurestaticapps.net/*
     http://localhost:3000/*
     ```

   - [ ] Save changes

2. **Configure Key Vault Access (if enabled)**

   ```bash
   # Restrict access to specific users
   az keyvault set-policy \
     --name <vault-name> \
     --upn your-email@example.com \
     --secret-permissions get list
   ```

3. **Review Resource Tags**

   ```bash
   az resource list \
     --resource-group bcps-redistricting-prod-rg \
     --query "[].{Name:name, Type:type, Tags:tags}"
   ```

**Status**: [ ] Complete

---

### Phase 6: CI/CD Setup (Optional, 15 minutes)

If you want automatic deployments on git push:

1. **Create Azure Service Principal**

   ```bash
   az ad sp create-for-rbac \
     --name "bcps-redistricting-github" \
     --role contributor \
     --scopes /subscriptions/<subscription-id>/resourceGroups/bcps-redistricting-prod-rg \
     --sdk-auth
   ```

   Copy the JSON output

2. **Add GitHub Secrets**
   - Go to GitHub repo → Settings → Secrets → Actions
   - Add `AZURE_CREDENTIALS` with the JSON from step 1
   - Add `AZURE_STATIC_WEB_APPS_API_TOKEN`:

     ```bash
     terraform output -raw deployment_token
     ```

   - Add `MAPBOX_API_KEY` (fallback):

     ```
     <Your Mapbox API key from https://account.mapbox.com/access-tokens/>
     ```

3. **Test GitHub Actions**
   - Merge this branch to master (or push to master)
   - Check Actions tab in GitHub
   - Verify build and deployment succeed

**Status**: [ ] Complete | [ ] Skipped

---

### Phase 7: Custom Domain (Optional, 30 minutes)

If you want to use a custom domain:

1. **Add domain to Terraform**

   ```hcl
   # In terraform.tfvars
   custom_domain = "redistricting.yourschool.org"
   ```

2. **Apply changes**

   ```bash
   terraform apply
   ```

3. **Configure DNS**
   Add CNAME record:

   ```
   Type:  CNAME
   Name:  redistricting
   Value: <your-app-hostname>.azurestaticapps.net
   TTL:   3600
   ```

4. **Wait for SSL provisioning** (5-15 minutes)

   ```bash
   az staticwebapp show \
     --name $(terraform output -raw static_web_app_name) \
     --resource-group $(terraform output -raw resource_group_name) \
     --query customDomains
   ```

5. **Update Mapbox URL restrictions** to include custom domain

**Custom Domain**: ________________________________

**Status**: [ ] Complete | [ ] Skipped

---

## Post-Deployment

### Documentation

- [ ] Update project README with production URL
- [ ] Document any custom configuration
- [ ] Share access with team members

### Monitoring Setup

- [ ] Set up Azure Monitor alerts (optional)
- [ ] Configure usage analytics (optional)
- [ ] Set up cost alerts (optional)

### Backup Plan

- [ ] Document rollback procedure
- [ ] Keep Terraform state backed up
- [ ] Test disaster recovery (optional)

---

## Rollback Procedure

If something goes wrong:

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

---

## Cost Tracking

**Expected Monthly Cost** (Free Tier):

- Static Web App: $0
- Key Vault: $0 (1000 operations free)
- Bandwidth: $0 (100 GB free)

**Total**: $0/month for Free tier

**Standard Tier**: ~$9/month if you upgrade

**Monitor costs**: https://portal.azure.com → Cost Management

---

## Support & Troubleshooting

### Common Issues

**Issue**: Terraform apply fails with "name already exists"

- **Solution**: Resource names must be unique. Edit `terraform.tfvars` to change `project_name`

**Issue**: Map doesn't load in production

- **Solution**: Check browser console for API key errors, verify Key Vault secret

**Issue**: GitHub Actions fail with auth error

- **Solution**: Verify `AZURE_CREDENTIALS` secret is correct, check service principal permissions

**Issue**: Can't access Key Vault

- **Solution**: Grant yourself access with `az keyvault set-policy`

### Getting Help

- **Documentation**: See [DEPLOYMENT.md](./DEPLOYMENT.md) and [SECRETS.md](./SECRETS.md)
- **Azure Portal**: https://portal.azure.com
- **Terraform Docs**: https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs
- **Project Issues**: GitHub Issues tab

---

## Sign-Off

**Deployed By**: ________________________________

**Date**: ________________________________

**Environment**: Production

**Version/Commit**: ________________________________

**Status**: [ ] Success | [ ] Partial | [ ] Failed

**Notes**: ________________________________

---

## Next Steps After Deployment

1. **Merge to master** if deploying from feature branch
2. **Set up monitoring** for production health
3. **Share URL** with stakeholders
4. **Plan for updates** using CI/CD or manual deploys
5. **Review costs** after first month

---

## Appendix: Quick Commands

```bash
# Get application URL
cd terraform && terraform output application_url

# Get deployment token
cd terraform && terraform output -raw deployment_token

# Retrieve Mapbox key from Key Vault
az keyvault secret show \
  --name mapbox-api-key \
  --vault-name $(cd terraform && terraform output -raw key_vault_name) \
  --query value -o tsv

# Rebuild and redeploy
npm run build && ./deploy.sh --deploy-only

# Check deployment status in Azure Portal
az staticwebapp list --output table

# View application logs
az monitor activity-log list \
  --resource-group bcps-redistricting-prod-rg \
  --output table

# Destroy everything (careful!)
cd terraform && terraform destroy
```

---

**Last Updated**: 2026-02-03  
**Current Development**: Full-stack with PostgreSQL + PostGIS backend  
**Documentation**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for full-stack deployment
