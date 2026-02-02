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

# Database outputs
output "db_server_name" {
  description = "PostgreSQL server name"
  value       = azurerm_postgresql_flexible_server.main.name
}

output "db_fqdn" {
  description = "PostgreSQL server fully qualified domain name"
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "db_name" {
  description = "PostgreSQL database name"
  value       = azurerm_postgresql_flexible_server_database.main.name
}

output "db_connection_string" {
  description = "PostgreSQL connection string (without password)"
  value       = "postgresql://${var.db_admin_username}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.main.name}?sslmode=require"
  sensitive   = true
}

# API outputs
output "api_fqdn" {
  description = "API fully qualified domain name"
  value       = azurerm_container_app.api.latest_revision_fqdn
}

output "api_url" {
  description = "Full URL to access the API"
  value       = "https://${azurerm_container_app.api.latest_revision_fqdn}"
}

output "container_app_name" {
  description = "Name of the container app"
  value       = azurerm_container_app.api.name
}

output "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID for monitoring"
  value       = azurerm_log_analytics_workspace.main.id
}
