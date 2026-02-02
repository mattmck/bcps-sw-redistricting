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
