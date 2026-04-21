module "vm" {
  source = "git::https://github.com/tdkglobal/common-infra.git//modules/vm"

  default_name        = "${var.project_name}-${var.az_env}"
  resource_group_name = module.rg.resource_group_name
  az_env              = var.az_env
  az_location         = var.az_location

  vm_list                   = var.vm_list
  subnet_id                 = data.azurerm_subnet.client.id
  network_security_group_id = data.azurerm_network_security_group.client.id

  # custom_data = base64encode("curl -X GET -H \"x-ms-version: 2019-07-07\" \"${module.upload_shell_script.blob_url}?restype=share&${data.azurerm_storage_account_sas.this.sas}\" -o /home/admin_user/install.sh")

  tags = {
    "role" = "client"
    "name" = var.project_name
  }
}


resource "null_resource" "run_shell_script" {
  depends_on = [module.vm]

  provisioner "local-exec" {
    command = <<-EOT
      ssh -o StrictHostKeyChecking=no -i ${module.vm.vm_pem_filename["01"]} admin_user@${module.vm.vm_ip["01"]} 'bash -s' < ../scripts/install.sh
      install_rc=$?
      ssh -o StrictHostKeyChecking=no -i ${module.vm.vm_pem_filename["01"]} admin_user@${module.vm.vm_ip["01"]} 'umask 077; mkdir -p ~/.ssh; chmod 700 ~/.ssh; touch ~/.ssh/authorized_keys; chmod 600 ~/.ssh/authorized_keys; cat >> ~/.ssh/authorized_keys' < ../scripts/ansible_admin_key.pub || exit $?
      exit $install_rc
    EOT
  }
}

# upload alloy config
resource "null_resource" "upload_alloy_config" {
  depends_on = [module.vm, null_resource.run_shell_script]

  provisioner "local-exec" {
    command = "sed -i '' 's|myhostname|${module.vm.hostname["01"]}|' ../scripts/config.alloy; scp -o StrictHostKeyChecking=no -i ${module.vm.vm_pem_filename["01"]} ../scripts/config.alloy admin_user@${module.vm.vm_ip["01"]}:/home/admin_user/alloy.config"
  }
}