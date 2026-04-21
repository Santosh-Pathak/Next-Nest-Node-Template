resource "github_actions_variable" "host_name" {
  repository    = var.project_name
  variable_name = "HOST_NAME_${var.az_env}"
  value         = module.vm.private_ip_address["01"]
}

resource "github_actions_variable" "user_name" {
  repository    = var.project_name
  variable_name = "USER_NAME_${var.az_env}"
  value         = module.vm.vm_username["01"]
}

resource "github_actions_secret" "vm_key" {
  repository      = var.project_name
  secret_name     = "VM_KEY_${var.az_env}"
  plaintext_value = module.vm.vm_pem_content["01"]
}

data "azurerm_key_vault" "ssh-key" {
  name                = "kv-tedekstra-store"
  resource_group_name = "rg-shared-svc-prod"
}

resource "azurerm_key_vault_secret" "vm_key" {
  name         = split(".", module.vm.vm_pem_filename["01"])[0]
  value        = module.vm.vm_pem_content["01"]
  key_vault_id = data.azurerm_key_vault.ssh-key.id
  depends_on   = [module.vm]
}

resource "github_actions_secret" "storage_account_access_key" {
  repository      = var.project_name
  secret_name     = "STORAGE_ACCOUNT_ACCESS_KEY_${var.az_env}"
  plaintext_value = module.storage_account.access_key
}

resource "github_actions_variable" "storage_account_name" {
  repository    = var.project_name
  variable_name = "STORAGE_ACCOUNT_NAME_${var.az_env}"
  value         = local.storage_account_name
}
