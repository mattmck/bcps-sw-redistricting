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
  db_server_name      = "${var.project_name}-${var.environment}-pg"
  db_name             = "bcps_redistricting"
  container_env_name  = "${var.project_name}-${var.environment}-env"
  container_app_name  = "${var.project_name}-${var.environment}-api"
  log_analytics_name  = "${var.project_name}-${var.environment}-logs"
  
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

# Log Analytics Workspace for Container Apps
resource "azurerm_log_analytics_workspace" "main" {
  name                = local.log_analytics_name
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = local.common_tags
}

# PostgreSQL Flexible Server with PostGIS
resource "azurerm_postgresql_flexible_server" "main" {
  name                   = local.db_server_name
  resource_group_name    = azurerm_resource_group.main.name
  location               = azurerm_resource_group.main.location
  version                = "15"
  administrator_login    = var.db_admin_username
  administrator_password = var.db_admin_password
  
  storage_mb = var.db_storage_mb
  sku_name   = var.db_sku_name
  
  backup_retention_days        = var.db_backup_retention_days
  geo_redundant_backup_enabled = var.db_geo_redundant_backup
  
  tags = local.common_tags
}

# PostgreSQL Database
resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = local.db_name
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# Enable PostGIS extension
resource "azurerm_postgresql_flexible_server_configuration" "postgis" {
  name      = "azure.extensions"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "POSTGIS"
}

# Firewall rule to allow Azure services
resource "azurerm_postgresql_flexible_server_firewall_rule" "azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# Container Apps Environment
resource "azurerm_container_app_environment" "main" {
  name                       = local.container_env_name
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  tags                       = local.common_tags
}

# Container App for API
resource "azurerm_container_app" "api" {
  name                         = local.container_app_name
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"
  tags                         = local.common_tags
  
  template {
    container {
      name   = "api"
      image  = var.api_docker_image != "" ? var.api_docker_image : "nginx:alpine"  # Placeholder
      cpu    = var.container_app_cpu
      memory = var.container_app_memory
      
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      
      env {
        name  = "DB_HOST"
        value = azurerm_postgresql_flexible_server.main.fqdn
      }
      
      env {
        name  = "DB_PORT"
        value = "5432"
      }
      
      env {
        name  = "DB_NAME"
        value = local.db_name
      }
      
      env {
        name  = "DB_USER"
        value = var.db_admin_username
      }
      
      env {
        name        = "DB_PASSWORD"
        secret_name = "db-password"
      }
    }
    
    min_replicas = var.container_app_min_replicas
    max_replicas = var.container_app_max_replicas
  }
  
  secret {
    name  = "db-password"
    value = var.db_admin_password
  }
  
  ingress {
    external_enabled = true
    target_port      = 4000
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
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
    db-password    = var.db_admin_password
  }
  
  tags = local.common_tags
  
  # Use access policies instead of RBAC for simpler setup
  enable_rbac_authorization = false
}
