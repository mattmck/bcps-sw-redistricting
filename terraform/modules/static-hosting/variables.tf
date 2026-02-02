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

variable "sku_tier" {
  description = "Service tier for hosting"
  type        = string
  default     = "Free"
}

variable "resource_group_name" {
  description = "Resource group name (leave empty to auto-generate)"
  type        = string
  default     = ""
}

variable "custom_domain" {
  description = "Custom domain for the application (optional)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
