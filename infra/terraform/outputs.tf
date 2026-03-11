output "elastic_beanstalk_application_name" {
  description = "Elastic Beanstalk application name."
  value       = aws_elastic_beanstalk_application.web.name
}

output "elastic_beanstalk_environment_name" {
  description = "Elastic Beanstalk environment name."
  value       = aws_elastic_beanstalk_environment.web.name
}

output "elastic_beanstalk_cname" {
  description = "Elastic Beanstalk CNAME for the web environment."
  value       = aws_elastic_beanstalk_environment.web.cname
}

output "suggested_next_public_app_url" {
  description = "Suggested temporary NEXT_PUBLIC_APP_URL for initial smoke testing."
  value       = "http://${aws_elastic_beanstalk_environment.web.cname}"
}

output "rds_endpoint" {
  description = "PostgreSQL endpoint hostname."
  value       = aws_db_instance.postgres.address
}

output "rds_port" {
  description = "PostgreSQL port."
  value       = aws_db_instance.postgres.port
}

output "database_name" {
  description = "Database name provisioned in RDS."
  value       = aws_db_instance.postgres.db_name
}

output "database_username" {
  description = "Database master username."
  value       = aws_db_instance.postgres.username
}

output "database_url" {
  description = "Runtime DATABASE_URL already injected into Elastic Beanstalk."
  value       = local.database_url
  sensitive   = true
}
