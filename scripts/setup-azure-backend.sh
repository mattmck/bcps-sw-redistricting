#!/bin/bash
set -e

# BCPS Redistricting - Azure Backend Infrastructure Setup
# This script prepares Azure resources needed before running terraform apply

echo "🚀 Setting up Azure infrastructure for backend deployment"
echo ""

# Configuration
RESOURCE_GROUP="bcps-redistricting-prod-rg"
ACR_NAME="bcpsredistrictingacr"
LOCATION="eastus2"

# Check Azure CLI
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Install with: brew install azure-cli"
    exit 1
fi

# Check if logged in
echo "Checking Azure authentication..."
if ! az account show &> /dev/null; then
    echo "❌ Not logged in to Azure. Run: az login"
    exit 1
fi

SUBSCRIPTION=$(az account show --query name -o tsv)
echo "✅ Logged in to Azure subscription: $SUBSCRIPTION"
echo ""

# Create Azure Container Registry (if not exists)
echo "1. Checking Azure Container Registry..."
if az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo "✅ ACR already exists: $ACR_NAME"
else
    echo "Creating Azure Container Registry: $ACR_NAME"
    
    # Check if resource group exists, create if not
    if ! az group show --name $RESOURCE_GROUP &> /dev/null; then
        echo "Creating resource group: $RESOURCE_GROUP"
        az group create --name $RESOURCE_GROUP --location $LOCATION
    fi
    
    az acr create \
        --resource-group $RESOURCE_GROUP \
        --name $ACR_NAME \
        --sku Basic \
        --location $LOCATION
    
    echo "✅ ACR created: $ACR_NAME"
fi
echo ""

# Build and push backend Docker image
echo "2. Building and pushing backend API Docker image..."
cd backend

# Login to ACR
az acr login --name $ACR_NAME

# Build image
echo "Building Docker image..."
docker build -t ${ACR_NAME}.azurecr.io/redistricting-api:latest .

# Push to ACR
echo "Pushing to Azure Container Registry..."
docker push ${ACR_NAME}.azurecr.io/redistricting-api:latest

echo "✅ Docker image pushed: ${ACR_NAME}.azurecr.io/redistricting-api:latest"
echo ""

cd ..

# Check/create terraform.tfvars
echo "3. Checking Terraform configuration..."
cd terraform

if [ ! -f terraform.tfvars ]; then
    echo "⚠️  terraform.tfvars not found. Creating from example..."
    cp terraform.tfvars.example terraform.tfvars
    
    # Update with ACR image
    sed -i.bak "s|api_docker_image.*|api_docker_image = \"${ACR_NAME}.azurecr.io/redistricting-api:latest\"|" terraform.tfvars
    rm terraform.tfvars.bak
    
    echo "⚠️  IMPORTANT: Edit terraform/terraform.tfvars and set:"
    echo "   - db_admin_password (use a strong password)"
    echo "   - mapbox_api_key (from your Mapbox account)"
    echo ""
    echo "Then run: cd terraform && terraform plan"
    exit 0
else
    echo "✅ terraform.tfvars exists"
    
    # Update api_docker_image in existing file if needed
    if ! grep -q "${ACR_NAME}.azurecr.io/redistricting-api" terraform.tfvars; then
        echo "Updating api_docker_image in terraform.tfvars..."
        sed -i.bak "s|api_docker_image.*|api_docker_image = \"${ACR_NAME}.azurecr.io/redistricting-api:latest\"|" terraform.tfvars
        rm terraform.tfvars.bak
    fi
fi

echo ""
echo "✅ Setup complete! Next steps:"
echo ""
echo "1. Review configuration:"
echo "   cat terraform/terraform.tfvars"
echo ""
echo "2. Plan Terraform deployment:"
echo "   cd terraform"
echo "   terraform init"
echo "   terraform plan"
echo ""
echo "3. Apply infrastructure (creates PostgreSQL + Container App):"
echo "   terraform apply"
echo ""
echo "4. Run database migrations on Azure PostgreSQL:"
echo "   # Get DB connection from terraform outputs"
echo "   # Run Flyway migrations"
echo "   # Run data import: npm run migrate"
echo ""
echo "5. Test deployment:"
echo "   curl https://\$(terraform output -raw api_url)/health"
echo ""
