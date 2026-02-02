output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "static_web_app_name" {
  description = "Name of the static web app"
  value       = azurerm_static_web_app.main.name
}

output "default_hostname" {
  description = "Default hostname for the application"
  value       = azurerm_static_web_app.main.default_host_name
}

output "application_url" {
  description = "Full URL to access the application"
  value       = "https://${azurerm_static_web_app.main.default_host_name}"
}

output "api_key" {
  description = "API key for deploying to the static web app"
  value       = azurerm_static_web_app.main.api_key
  sensitive   = true
}

output "deployment_token" {
  description = "Deployment token for CI/CD pipelines"
  value       = azurerm_static_web_app.main.api_key
  sensitive   = true
}

output "key_vault_name" {
  description = "Name of the Azure Key Vault (if enabled)"
  value       = var.enable_secrets_manager ? module.secrets[0].vault_name : ""
}

output "key_vault_uri" {
  description = "URI of the Azure Key Vault (if enabled)"
  value       = var.enable_secrets_manager ? module.secrets[0].vault_uri : ""
}

output "mapbox_api_key" {
  description = "Mapbox API key from Key Vault"
  value       = var.mapbox_api_key
  sensitive   = true
}
