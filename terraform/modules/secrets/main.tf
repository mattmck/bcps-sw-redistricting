# Azure Key Vault implementation of secrets module
# This can be swapped with AWS Secrets Manager or GCP Secret Manager

data "azurerm_client_config" "current" {}

locals {
  # Azure Key Vault names must be 3-24 chars, alphanumeric and dashes only
  # Use shortened name to stay within limit
  vault_name = "bcps-redis-${var.environment}-kv"
}

resource "azurerm_key_vault" "main" {
  name                       = local.vault_name
  location                   = var.location
  resource_group_name        = var.resource_group_name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 7
  purge_protection_enabled   = false
  
  enable_rbac_authorization = var.enable_rbac_authorization
  
  # If RBAC is disabled, use access policies
  dynamic "access_policy" {
    for_each = var.enable_rbac_authorization ? [] : [1]
    content {
      tenant_id = data.azurerm_client_config.current.tenant_id
      object_id = data.azurerm_client_config.current.object_id
      
      secret_permissions = [
        "Get",
        "List",
        "Set",
        "Delete",
        "Recover",
        "Backup",
        "Restore",
        "Purge"
      ]
    }
  }
  
  tags = var.tags
}

# Store each secret
resource "azurerm_key_vault_secret" "secrets" {
  for_each = nonsensitive(var.secrets)
  
  name         = each.key
  value        = each.value
  key_vault_id = azurerm_key_vault.main.id
  
  tags = var.tags
}
