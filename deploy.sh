#!/bin/bash
set -e

# BCPS Redistricting Tool - Azure Deployment Script
# This script handles the complete deployment process

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/terraform"

echo "🚀 BCPS Redistricting Tool - Azure Deployment"
echo "=============================================="

# Check prerequisites
check_prereqs() {
  echo "📋 Checking prerequisites..."
  
  if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
  fi
  
  if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform not found. Install: brew install terraform"
    exit 1
  fi
  
  if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install: brew install node"
    exit 1
  fi
  
  echo "✅ All prerequisites met"
}

# Azure login check
check_azure_login() {
  echo "🔐 Checking Azure login status..."
  
  if ! az account show &> /dev/null; then
    echo "⚠️  Not logged into Azure. Running 'az login'..."
    az login
  else
    ACCOUNT=$(az account show --query name -o tsv)
    echo "✅ Logged in to Azure account: $ACCOUNT"
  fi
}

# Initialize Terraform
init_terraform() {
  echo "🔧 Initializing Terraform..."
  cd "$TERRAFORM_DIR"
  
  if [ ! -f "terraform.tfvars" ]; then
    echo "⚠️  terraform.tfvars not found. Creating from example..."
    cp terraform.tfvars.example terraform.tfvars
    echo "📝 Edit terraform/terraform.tfvars to customize deployment"
    read -p "Press Enter to continue after editing, or Ctrl+C to abort..."
  fi
  
  terraform init
  echo "✅ Terraform initialized"
}

# Plan infrastructure
plan_infrastructure() {
  echo "📊 Planning infrastructure..."
  cd "$TERRAFORM_DIR"
  terraform plan -out=tfplan
  echo "✅ Plan created"
}

# Apply infrastructure
apply_infrastructure() {
  echo "🏗️  Creating Azure resources..."
  cd "$TERRAFORM_DIR"
  terraform apply tfplan
  echo "✅ Infrastructure deployed"
}

# Build application
build_app() {
  echo "🔨 Building React application..."
  cd "$SCRIPT_DIR"
  
  if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
  fi
  
  # Get Mapbox API key from Key Vault if available
  cd "$TERRAFORM_DIR"
  VAULT_NAME=$(terraform output -raw key_vault_name 2>/dev/null || echo "")
  
  if [ -n "$VAULT_NAME" ] && [ "$VAULT_NAME" != "" ]; then
    echo "🔐 Retrieving Mapbox API key from Azure Key Vault..."
    MAPBOX_KEY=$(az keyvault secret show \
      --name mapbox-api-key \
      --vault-name "$VAULT_NAME" \
      --query value -o tsv 2>/dev/null || echo "")
    
    if [ -n "$MAPBOX_KEY" ]; then
      echo "✅ Mapbox API key retrieved from Key Vault"
      export VITE_MAPBOX_ACCESS_TOKEN="$MAPBOX_KEY"
    else
      echo "⚠️  Could not retrieve from Key Vault, using .env.local"
    fi
  else
    echo "ℹ️  Using Mapbox API key from .env.local"
  fi
  
  cd "$SCRIPT_DIR"
  npm run build
  echo "✅ Application built"
}

# Deploy application
deploy_app() {
  echo "📤 Deploying application to Azure..."
  cd "$SCRIPT_DIR"
  
  DEPLOYMENT_TOKEN=$(cd "$TERRAFORM_DIR" && terraform output -raw deployment_token)
  
  if [ -z "$DEPLOYMENT_TOKEN" ]; then
    echo "❌ Failed to get deployment token"
    exit 1
  fi
  
  npx @azure/static-web-apps-cli deploy \
    --app-location ./dist \
    --deployment-token "$DEPLOYMENT_TOKEN"
  
  echo "✅ Application deployed"
}

# Show deployment info
show_info() {
  echo ""
  echo "🎉 Deployment Complete!"
  echo "======================"
  cd "$TERRAFORM_DIR"
  
  APP_URL=$(terraform output -raw application_url)
  HOSTNAME=$(terraform output -raw default_hostname)
  
  echo "Application URL: $APP_URL"
  echo "Hostname: $HOSTNAME"
  echo ""
  echo "💡 To update the app:"
  echo "   npm run build && ./deploy.sh --deploy-only"
  echo ""
  echo "💡 To destroy infrastructure:"
  echo "   cd terraform && terraform destroy"
}

# Main execution
main() {
  case "${1:-}" in
    --deploy-only)
      echo "📤 Deploy-only mode"
      check_prereqs
      build_app
      deploy_app
      show_info
      ;;
    --infra-only)
      echo "🏗️  Infrastructure-only mode"
      check_prereqs
      check_azure_login
      init_terraform
      plan_infrastructure
      apply_infrastructure
      ;;
    --help)
      echo "Usage: ./deploy.sh [option]"
      echo ""
      echo "Options:"
      echo "  (no args)       Full deployment (infrastructure + app)"
      echo "  --deploy-only   Deploy app only (skip infrastructure)"
      echo "  --infra-only    Deploy infrastructure only (skip app)"
      echo "  --help          Show this help message"
      exit 0
      ;;
    *)
      echo "🚀 Full deployment mode"
      check_prereqs
      check_azure_login
      init_terraform
      plan_infrastructure
      apply_infrastructure
      build_app
      deploy_app
      show_info
      ;;
  esac
}

main "$@"
