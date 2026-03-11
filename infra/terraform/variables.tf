variable "aws_region" {
  description = "AWS region for the Parqara infrastructure."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used for tags and resource naming."
  type        = string
  default     = "parqara"
}

variable "deployment_environment" {
  description = "Environment label used in tags."
  type        = string
  default     = "prod"
}

variable "elastic_beanstalk_application_name" {
  description = "Elastic Beanstalk application name."
  type        = string
  default     = "parqara-web"
}

variable "elastic_beanstalk_environment_name" {
  description = "Elastic Beanstalk environment name."
  type        = string
  default     = "parqara-web-env-1"
}

variable "elastic_beanstalk_cname_prefix" {
  description = "Optional CNAME prefix for the Elastic Beanstalk environment."
  type        = string
  default     = null
}

variable "elastic_beanstalk_instance_type" {
  description = "EC2 instance type for the low-cost Elastic Beanstalk environment."
  type        = string
  default     = "t3.small"
}

variable "elastic_beanstalk_solution_stack_name_regex" {
  description = "Regex used to pick the most recent supported Elastic Beanstalk Node.js platform."
  type        = string
  default     = "^64bit Amazon Linux 2023 v.* running Node.js 22$"
}

variable "db_identifier" {
  description = "RDS instance identifier."
  type        = string
  default     = "parqara-db-prod"
}

variable "db_name" {
  description = "Database name created inside PostgreSQL."
  type        = string
  default     = "parqara"
}

variable "db_username" {
  description = "Master username for PostgreSQL."
  type        = string
  default     = "parqara_admin"
}

variable "db_password" {
  description = "Optional master password for PostgreSQL. Terraform will generate one if omitted."
  type        = string
  default     = null
  sensitive   = true
}

variable "db_instance_class" {
  description = "Low-cost RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "Initial RDS storage in GiB."
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum autoscaled RDS storage in GiB."
  type        = number
  default     = 50
}

variable "db_engine_version" {
  description = "Optional PostgreSQL engine version. Leave null to use the provider default."
  type        = string
  default     = null
}

variable "db_backup_retention_period" {
  description = "RDS backup retention period in days."
  type        = number
  default     = 1
}

variable "db_skip_final_snapshot" {
  description = "Skip the final snapshot when destroying the RDS instance."
  type        = bool
  default     = true
}

variable "db_deletion_protection" {
  description = "Enable deletion protection on the RDS instance."
  type        = bool
  default     = false
}

variable "session_secret" {
  description = "Optional session secret for the app. Terraform will generate one if omitted."
  type        = string
  default     = null
  sensitive   = true
}

variable "preview_gate_enabled" {
  description = "Whether the temporary preview password gate should remain enabled."
  type        = bool
  default     = true
}

variable "preview_gate_password" {
  description = "Preview password used by the temporary gate."
  type        = string
  default     = "yard"
}

variable "skip_db_bootstrap" {
  description = "Skip Prisma migrate/seed during the Elastic Beanstalk predeploy hook."
  type        = bool
  default     = false
}

variable "app_url" {
  description = "Optional canonical production app origin used for server-side auth callbacks and email-link auth."
  type        = string
  default     = null
}

variable "next_public_app_url" {
  description = "Optional public browser-facing app origin. Keep it aligned with app_url if you set both."
  type        = string
  default     = null
}

variable "application_environment" {
  description = "Additional Elastic Beanstalk environment variables for app integrations like Google, Postmark, and OpenAI."
  type        = map(string)
  default     = {}
}

variable "allowed_ingress_cidrs" {
  description = "CIDR blocks allowed to reach the Elastic Beanstalk instance over HTTP."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "ec2_key_name" {
  description = "Optional EC2 key pair name for SSH access to the Elastic Beanstalk instance."
  type        = string
  default     = null
}

variable "ssh_ingress_cidrs" {
  description = "Optional CIDR blocks allowed to SSH to the Elastic Beanstalk instance."
  type        = list(string)
  default     = []
}

variable "vpc_id" {
  description = "Optional existing VPC ID. Defaults to the account default VPC."
  type        = string
  default     = null
}

variable "subnet_ids" {
  description = "Optional list of subnet IDs. Defaults to all subnets in the selected or default VPC."
  type        = list(string)
  default     = null
}

variable "tags" {
  description = "Additional tags applied to all supported resources."
  type        = map(string)
  default     = {}
}


