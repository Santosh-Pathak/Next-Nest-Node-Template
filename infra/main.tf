terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "4.35.0"
    }
    github = {
      source  = "integrations/github"
      version = "6.6.0"
    }
  }

  backend "azurerm" {
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}

provider "github" {
  owner = var.repository
  token = var.github_token
}

data "azurerm_client_config" "current" {}
