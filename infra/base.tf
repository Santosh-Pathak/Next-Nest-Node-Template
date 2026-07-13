module "rg" {
  # Replace with your shared Terraform module registry / repo
  source = "git::https://github.com/YOUR_ORG/common-infra.git//modules/rg"

  project_name = var.project_name
  az_env       = var.az_env
  az_location  = var.az_location
  tags = {
    "role" = "common"
  }
}

data "http" "myip" {
  url = "https://ipv4.icanhazip.com"
}

data "azurerm_virtual_network" "client" {
  name                = "vnet-shared-svc-prod"
  resource_group_name = "rg-shared-svc-prod"
}

data "azurerm_subnet" "client" {
  name                 = "subnet-public"
  virtual_network_name = data.azurerm_virtual_network.client.name
  resource_group_name  = "rg-shared-svc-prod"
}

data "azurerm_network_security_group" "client" {
  name                = "nsg-shared-svc-prod"
  resource_group_name = "rg-shared-svc-prod"
}
