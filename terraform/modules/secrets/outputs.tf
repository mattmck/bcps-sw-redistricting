output "vault_name" {
  description = "Name of the Key Vault"
  value       = azurerm_key_vault.main.name
}

output "vault_id" {
  description = "ID of the Key Vault"
  value       = azurerm_key_vault.main.id
}

output "vault_uri" {
  description = "URI of the Key Vault"
  value       = azurerm_key_vault.main.vault_uri
}

output "secret_names" {
  description = "List of secret names stored in the vault"
  value       = keys(var.secrets)
}

output "secret_ids" {
  description = "Map of secret names to their IDs"
  value       = { for k, v in azurerm_key_vault_secret.secrets : k => v.id }
  sensitive   = true
}
