# Azure implementation of static hosting module
# This can be swapped with AWS/GCP implementations while keeping the same interface

locals {
  resource_group_name = var.resource_group_name != "" ? var.resource_group_name : "${var.app_name}-${var.environment}-rg"
  static_web_app_name = "${var.app_name}-${var.environment}-swa"
}

resource "azurerm_resource_group" "main" {
  name     = local.resource_group_name
  location = var.location
  tags     = var.tags
}

resource "azurerm_static_web_app" "main" {
  name                = local.static_web_app_name
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  sku_tier            = var.sku_tier
  sku_size            = var.sku_tier
  tags                = var.tags
}

resource "azurerm_static_web_app_custom_domain" "main" {
  count = var.custom_domain != "" ? 1 : 0
  
  static_web_app_id = azurerm_static_web_app.main.id
  domain_name       = var.custom_domain
  validation_type   = "cname-delegation"
}
