locals {
  storage_account_name_intial = replace(var.project_name, "-", "")
  storage_account_name        = "st${local.storage_account_name_intial}${var.az_env}"
}

module "storage_account" {
  # Replace with your shared Terraform module registry / repo
  source               = "git::https://github.com/YOUR_ORG/common-infra.git//modules/storage"
  storage_account_name = local.storage_account_name
  resource_group_name  = module.rg.resource_group_name
  az_location          = var.az_location

}

// module "cosmosdb" {
//   source = "git::https://github.com/YOUR_ORG/common-infra.git//modules/cosmosdb"

//   resource_group_name = module.rg.resource_group_name
//   az_location         = var.az_location
//   default_name        = "${var.project_name}-${var.az_env}"

// }