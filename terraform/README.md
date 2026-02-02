# Terraform Deployment for BCPS Redistricting Tool

This directory contains Terraform configuration for deploying the BCPS School Redistricting Tool to Azure in a cloud-agnostic manner.

## Architecture

- **Hosting**: Azure Static Web Apps (equivalent to AWS S3+CloudFront, GCP Cloud Storage+CDN)
- **SSL**: Automatic HTTPS with managed certificates
- **CDN**: Global content delivery network included
- **Build**: Vite production build deployed as static assets

## Prerequisites

1. **Azure CLI**: Install and authenticate
   ```bash
   az login
   ```

2. **Terraform**: Install Terraform >= 1.0
   ```bash
   brew install terraform  # macOS
   ```

3. **Node.js**: Ensure Node >= 18 for building the app
   ```bash
   node --version  # Should be >= 18.0.0
   ```

## Deployment Steps

### 1. Initialize Terraform
```bash
cd terraform
terraform init
```

### 2. Review Configuration
Edit `terraform.tfvars` to customize deployment:
```hcl
project_name = "bcps-redistricting"
environment  = "prod"
location     = "eastus"
sku_tier     = "Free"  # or "Standard" for production
```

### 3. Plan Deployment
```bash
terraform plan -out=tfplan
```

### 4. Apply Infrastructure
```bash
terraform apply tfplan
```

### 5. Get Deployment Token
```bash
terraform output -raw deployment_token
```

### 6. Build and Deploy Application
```bash
# Build the React app
cd ..
npm install
npm run build

# Deploy using Azure Static Web Apps CLI
npx @azure/static-web-apps-cli deploy \
  --app-location ./dist \
  --deployment-token $(cd terraform && terraform output -raw deployment_token)
```

## Configuration Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `project_name` | Name prefix for resources | `bcps-redistricting` |
| `environment` | Environment name | `prod` |
| `location` | Azure region | `eastus` |
| `sku_tier` | Pricing tier (Free/Standard) | `Free` |
| `custom_domain` | Custom domain (optional) | `""` |
| `tags` | Resource tags | See `variables.tf` |

## Outputs

After deployment, Terraform provides:
- `application_url`: Public URL to access the app
- `deployment_token`: Token for CI/CD deployments
- `default_hostname`: Azure-provided hostname

## Cloud-Agnostic Design

This configuration uses cloud-agnostic patterns:

1. **Variables**: Generic names (`location` vs `azure_region`)
2. **Outputs**: Standard outputs that work across providers
3. **Modular**: Can be adapted for AWS/GCP with minimal changes

### Adapting to Other Clouds

**AWS (S3 + CloudFront)**:
- Replace `azurerm_static_web_app` with `aws_s3_bucket` + `aws_cloudfront_distribution`
- Adjust variables and outputs accordingly

**GCP (Cloud Storage + CDN)**:
- Replace with `google_storage_bucket` + `google_compute_backend_bucket`
- Similar variable structure

## CI/CD Integration

### GitHub Actions
```yaml
- name: Deploy to Azure
  uses: Azure/static-web-apps-deploy@v1
  with:
    azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
    repo_token: ${{ secrets.GITHUB_TOKEN }}
    action: "upload"
    app_location: "/"
    output_location: "dist"
```

### Azure DevOps
```yaml
- task: AzureStaticWebApp@0
  inputs:
    app_location: '/'
    output_location: 'dist'
    azure_static_web_apps_api_token: $(deployment_token)
```

## Cost Estimation

**Free Tier**:
- 100 GB bandwidth/month
- Custom domains
- Automatic SSL
- **Cost**: $0/month

**Standard Tier**:
- Unlimited bandwidth
- SLA-backed uptime
- Advanced features
- **Cost**: ~$9/month

## Updating the Deployment

```bash
# Rebuild app
npm run build

# Redeploy
npx @azure/static-web-apps-cli deploy \
  --app-location ./dist \
  --deployment-token $(cd terraform && terraform output -raw deployment_token)
```

## Destroying Infrastructure

```bash
cd terraform
terraform destroy
```

## Troubleshooting

**Issue**: `terraform init` fails
- **Solution**: Ensure Azure CLI is logged in: `az login`

**Issue**: Build fails with Mapbox errors
- **Solution**: Verify Mapbox API key in code (see WARP.md)

**Issue**: Deployment token not working
- **Solution**: Regenerate: `terraform apply -replace=azurerm_static_web_app.main`

## Security Best Practices

1. **State Management**: Use remote backend (Azure Storage) for production
2. **Secrets**: Store deployment token in GitHub Secrets / Azure Key Vault
3. **Access Control**: Use Azure RBAC for resource management
4. **API Keys**: Mapbox key should be restricted by domain in Mapbox dashboard

## Additional Resources

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Project Documentation](../README.md)
