# Deployment Quick Start Guide

**Choose Your Path:**

## 🛠️ Option B: Manual Terraform (Recommended for Now)

**Perfect for:** Solo development, testing, maintaining full control

### One-Time Setup (15 minutes)

```bash
# 1. Create Azure Container Registry and push Docker image
./scripts/setup-azure-backend.sh

# 2. Configure Terraform variables
cd terraform
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars  # Set db_admin_password

# 3. Create Azure infrastructure
terraform init
terraform plan
terraform apply

# 4. Run database migrations (see BACKEND_DEPLOYMENT.md)
```

### Ongoing Deployments (Zero effort!)

```bash
# Just push to master - GitHub Actions handles everything
git push origin master
```

**That's it!** After initial setup, deployments are 100% automated.

---

## 🤖 Option A: Full GitHub Actions Automation

**Perfect for:** Production environments, teams, zero-touch deployments

### One-Time Setup (30 minutes)

**See:** [docs/GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md)

1. Create Azure Service Principal (4 secrets)
2. Create Azure Storage for Terraform state (2 secrets)
3. Add application secrets (2 secrets)
4. Trigger infrastructure workflow:
   ```bash
   gh workflow run deploy-infrastructure.yml -f terraform_action=apply
   ```

### Ongoing Deployments (Zero effort!)

```bash
# Push to master - EVERYTHING is automated
git push origin master

# Infrastructure changes trigger automatically
# Database migrations run automatically
# Code deploys automatically
```

**Zero manual intervention** after setup!

---

## Decision Matrix

| If you want to... | Choose... |
|-------------------|-----------|
| Get started quickly | **Option B** |
| Test locally first | **Option B** |
| Maintain control over infrastructure | **Option B** |
| Set up once and forget | **Option A** |
| Support a team | **Option A** |
| Production environment | **Option A** |
| Minimize ongoing work | **Either** (both have automated deployments) |

## Current Status

✅ **Local Development:** Backend running on Docker  
✅ **Option B Ready:** All scripts and workflows in place  
✅ **Option A Ready:** Workflow created, needs GitHub secrets setup  
⏳ **Azure Infrastructure:** Not yet deployed (waiting for your choice)

## Next Steps

### For Option B (Recommended Now):
```bash
./scripts/setup-azure-backend.sh
cd terraform && terraform apply
# See BACKEND_DEPLOYMENT.md for post-deployment steps
```

### For Option A (When Ready for Production):
```bash
# See docs/GITHUB_SECRETS_SETUP.md
# Then: gh workflow run deploy-infrastructure.yml -f terraform_action=apply
```

## Cost Comparison

Both options cost the **same** once deployed:
- **Development:** ~$27/month
- **Production:** ~$110/month (if scaled up)

The difference is **how** you deploy, not what you deploy.

## Related Documentation

- **BACKEND_DEPLOYMENT.md** - Complete deployment guide with detailed comparison
- **docs/GITHUB_SECRETS_SETUP.md** - GitHub secrets configuration (Option A)
- **terraform/README.md** - Terraform infrastructure details
- **.github/workflows/deploy-infrastructure.yml** - Automated infrastructure workflow
- **.github/workflows/deploy-fullstack.yml** - Automated code deployment workflow

---

**TL;DR:** Start with **Option B** to maintain control. Switch to **Option A** when you want full automation for production.
