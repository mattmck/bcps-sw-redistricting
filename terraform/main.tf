terraform {
  required_version = ">= 1.0"
  
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
  
  # Uncomment for remote state storage
  # backend "azurerm" {
  #   resource_group_name  = "terraform-state-rg"
  #   storage_account_name = "tfstatexxxxxx"
  #   container_name       = "tfstate"
  #   key                  = "redistricting.terraform.tfstate"
  # }
}

provider "azurerm" {
  features {}
}

# Local variables for naming consistency
locals {
  resource_group_name = var.resource_group_name != "" ? var.resource_group_name : "${var.project_name}-${var.environment}-rg"
  static_web_app_name = "${var.project_name}-${var.environment}-swa"
  
  common_tags = merge(
    var.tags,
    {
      Environment = var.environment
    }
  )
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = local.resource_group_name
  location = var.location
  tags     = local.common_tags
}

# Static Web App for hosting the React application
resource "azurerm_static_web_app" "main" {
  name                = local.static_web_app_name
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  sku_tier            = var.sku_tier
  sku_size            = var.sku_tier
  tags                = local.common_tags
}

# Custom domain mapping (optional)
resource "azurerm_static_web_app_custom_domain" "main" {
  count = var.custom_domain != "" ? 1 : 0
  
  static_web_app_id = azurerm_static_web_app.main.id
  domain_name       = var.custom_domain
  validation_type   = "cname-delegation"
}

# Secrets management (optional)
module "secrets" {
  count  = var.enable_secrets_manager ? 1 : 0
  source = "./modules/secrets"
  
  app_name            = var.project_name
  environment         = var.environment
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  
  secrets = {
    mapbox-api-key = var.mapbox_api_key
  }
  
  tags = local.common_tags
  
  # Use access policies instead of RBAC for simpler setup
  enable_rbac_authorization = false
}
