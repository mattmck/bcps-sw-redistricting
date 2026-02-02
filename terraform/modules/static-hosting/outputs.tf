output "hostname" {
  description = "Hostname for the application"
  value       = azurerm_static_web_app.main.default_host_name
}

output "url" {
  description = "Full URL to access the application"
  value       = "https://${azurerm_static_web_app.main.default_host_name}"
}

output "deployment_token" {
  description = "Token for deploying content"
  value       = azurerm_static_web_app.main.api_key
  sensitive   = true
}

output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "app_name" {
  description = "Name of the static web app"
  value       = azurerm_static_web_app.main.name
}
