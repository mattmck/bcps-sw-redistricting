variable "app_name" {
  description = "Name of the application"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "location" {
  description = "Cloud provider region"
  type        = string
}

variable "resource_group_name" {
  description = "Resource group name for the Key Vault"
  type        = string
}

variable "secrets" {
  description = "Map of secret names to secret values"
  type        = map(string)
  sensitive   = true
  default     = {}
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

variable "enable_rbac_authorization" {
  description = "Enable RBAC authorization for Key Vault"
  type        = bool
  default     = true
}
