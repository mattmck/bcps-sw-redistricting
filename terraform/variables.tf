# Cloud-agnostic variables
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "bcps-redistricting"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "location" {
  description = "Cloud provider region"
  type        = string
  default     = "eastus2"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "BCPS Redistricting"
    ManagedBy   = "Terraform"
    Application = "Redistricting Tool"
  }
}

# Azure-specific variables (can be abstracted for multi-cloud)
variable "resource_group_name" {
  description = "Azure resource group name (leave empty to auto-generate)"
  type        = string
  default     = ""
}

variable "sku_tier" {
  description = "SKU tier for static web app (Free or Standard)"
  type        = string
  default     = "Free"
}

variable "custom_domain" {
  description = "Custom domain for the application (optional)"
  type        = string
  default     = ""
}

variable "mapbox_api_key" {
  description = "Mapbox API key for production (stored in Key Vault). Must be provided via terraform.tfvars or TF_VAR_mapbox_api_key environment variable."
  type        = string
  sensitive   = true
  # No default - must be provided to avoid committing secrets to git
}

variable "enable_secrets_manager" {
  description = "Enable Azure Key Vault for secrets management"
  type        = bool
  default     = true
}

# Database configuration
variable "db_admin_username" {
  description = "Administrator username for PostgreSQL"
  type        = string
  default     = "bcps_admin"
}

variable "db_admin_password" {
  description = "Administrator password for PostgreSQL (must be provided via terraform.tfvars or TF_VAR_db_admin_password)"
  type        = string
  sensitive   = true
  # No default - must be provided to avoid committing secrets
}

variable "db_sku_name" {
  description = "Azure PostgreSQL SKU name (e.g., B_Standard_B1ms for burstable, GP_Standard_D2s_v3 for general purpose)"
  type        = string
  default     = "B_Standard_B1ms"
}

variable "db_storage_mb" {
  description = "Storage size in MB for PostgreSQL"
  type        = number
  default     = 32768  # 32 GB
}

variable "db_backup_retention_days" {
  description = "Backup retention days for PostgreSQL"
  type        = number
  default     = 7
}

variable "db_geo_redundant_backup" {
  description = "Enable geo-redundant backups"
  type        = bool
  default     = false
}

# Container Apps configuration
variable "container_app_cpu" {
  description = "CPU cores for container app"
  type        = number
  default     = 0.5
}

variable "container_app_memory" {
  description = "Memory in GB for container app"
  type        = string
  default     = "1Gi"
}

variable "container_app_min_replicas" {
  description = "Minimum number of container replicas"
  type        = number
  default     = 1
}

variable "container_app_max_replicas" {
  description = "Maximum number of container replicas"
  type        = number
  default     = 3
}

variable "api_docker_image" {
  description = "Docker image for the API (e.g., from Azure Container Registry or Docker Hub)"
  type        = string
  default     = ""  # Must be provided during deployment
}
