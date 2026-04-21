output "vm_connection_details" {
  value = module.vm.vm_connection_details
}

output "host_name" {
  value = module.vm.vm_ip["01"]
}

output "user_name" {
  value = module.vm.vm_username["01"]
}

output "vm_pem_filename" {
  value = module.vm.vm_pem_filename["01"]
}

// output "cosmos_primary_key" {
//   value = module.cosmosdb.primary_key
//   sensitive = true
// }

// output "cosmos_endpoint" {
//   value = module.cosmosdb.endpoint
// }

output "storage_account_access_key" {
  value     = module.storage_account.access_key
  sensitive = true

}

output "storage_account_name" {
  value = local.storage_account_name

}
