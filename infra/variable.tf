# ----------------------- common -----------------------

variable "project_name" {
  type        = string
  description = "(Required) Project Name"
}

variable "az_env" {
  type        = string
  description = "(optional) Project env"
  default     = "prod"
}

variable "az_location" {
  type        = string
  description = "(optional) Project location "
  default     = "ukwest"
}

variable "subscription_id" {
  type        = string
  description = "Subscription ID of Azure"
}


variable "vm_list" {

}

variable "github_token" {
  sensitive = true
}

variable "repository" {
  default = "tedekstra"
}