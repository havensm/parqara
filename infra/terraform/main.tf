data "aws_vpc" "default" {
  count   = var.vpc_id == null ? 1 : 0
  default = true
}

data "aws_subnets" "selected" {
  count = var.subnet_ids == null ? 1 : 0

  filter {
    name   = "vpc-id"
    values = [var.vpc_id != null ? var.vpc_id : data.aws_vpc.default[0].id]
  }
}

data "aws_subnet" "selected" {
  for_each = toset(var.subnet_ids != null ? var.subnet_ids : data.aws_subnets.selected[0].ids)

  id = each.value
}

data "aws_ec2_instance_type_offerings" "elastic_beanstalk" {
  filter {
    name   = "instance-type"
    values = [var.elastic_beanstalk_instance_type]
  }

  location_type = "availability-zone"
}

data "aws_elastic_beanstalk_solution_stack" "nodejs" {
  most_recent = true
  name_regex  = var.elastic_beanstalk_solution_stack_name_regex
}

resource "random_password" "db_password" {
  length  = 24
  special = false
}

resource "random_password" "session_secret" {
  length  = 48
  special = false
}

locals {
  vpc_id     = var.vpc_id != null ? var.vpc_id : data.aws_vpc.default[0].id
  subnet_ids = sort(var.subnet_ids != null ? var.subnet_ids : data.aws_subnets.selected[0].ids)
  elastic_beanstalk_subnet_ids = sort([
    for subnet in data.aws_subnet.selected : subnet.id
    if contains(data.aws_ec2_instance_type_offerings.elastic_beanstalk.locations, subnet.availability_zone)
  ])

  db_password    = var.db_password != null ? var.db_password : random_password.db_password.result
  session_secret = var.session_secret != null ? var.session_secret : random_password.session_secret.result

  database_url = format(
    "postgresql://%s:%s@%s:5432/%s?schema=public&sslmode=require",
    var.db_username,
    urlencode(local.db_password),
    aws_db_instance.postgres.address,
    var.db_name
  )

  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.deployment_environment
      ManagedBy   = "Terraform"
    },
    var.tags
  )

  base_application_environment = {
    DATABASE_URL          = local.database_url
    NODE_ENV              = "production"
    PREVIEW_GATE_ENABLED  = var.preview_gate_enabled ? "true" : "false"
    PREVIEW_GATE_PASSWORD = var.preview_gate_password
    SESSION_SECRET        = local.session_secret
    SKIP_DB_BOOTSTRAP     = var.skip_db_bootstrap ? "true" : "false"
  }

  optional_application_environment = merge(
    var.app_url != null ? {
      APP_URL = var.app_url
    } : {},
    var.next_public_app_url != null ? {
      NEXT_PUBLIC_APP_URL = var.next_public_app_url
    } : {}
  )

  eb_environment_variables = merge(
    local.base_application_environment,
    local.optional_application_environment,
    var.application_environment
  )
}

resource "aws_security_group" "elastic_beanstalk_instance" {
  name        = "${var.elastic_beanstalk_environment_name}-sg"
  description = "Access for the Parqara Elastic Beanstalk instance."
  vpc_id      = local.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_ingress_cidrs
  }

  dynamic "ingress" {
    for_each = var.ec2_key_name != null && length(var.ssh_ingress_cidrs) > 0 ? [1] : []

    content {
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = var.ssh_ingress_cidrs
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.common_tags
}

resource "aws_security_group" "postgres" {
  name        = "${var.db_identifier}-sg"
  description = "PostgreSQL access for the Parqara app."
  vpc_id      = local.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.elastic_beanstalk_instance.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.common_tags
}

resource "aws_db_subnet_group" "postgres" {
  name       = "${var.db_identifier}-subnets"
  subnet_ids = local.subnet_ids

  tags = local.common_tags

  lifecycle {
    precondition {
      condition     = length(local.subnet_ids) >= 2
      error_message = "RDS requires at least two subnets. Supply subnet_ids or use a VPC with multiple subnets."
    }
  }
}

resource "aws_db_instance" "postgres" {
  identifier                   = var.db_identifier
  allocated_storage            = var.db_allocated_storage
  apply_immediately            = true
  auto_minor_version_upgrade   = true
  backup_retention_period      = var.db_backup_retention_period
  copy_tags_to_snapshot        = true
  db_name                      = var.db_name
  db_subnet_group_name         = aws_db_subnet_group.postgres.name
  deletion_protection          = var.db_deletion_protection
  delete_automated_backups     = true
  engine                       = "postgres"
  engine_version               = var.db_engine_version
  instance_class               = var.db_instance_class
  max_allocated_storage        = var.db_max_allocated_storage
  multi_az                     = false
  password                     = local.db_password
  performance_insights_enabled = false
  publicly_accessible          = false
  skip_final_snapshot          = var.db_skip_final_snapshot
  storage_encrypted            = true
  storage_type                 = "gp3"
  username                     = var.db_username
  vpc_security_group_ids       = [aws_security_group.postgres.id]

  tags = local.common_tags
}

data "aws_iam_policy_document" "elastic_beanstalk_service_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      identifiers = ["elasticbeanstalk.amazonaws.com"]
      type        = "Service"
    }
  }
}

resource "aws_iam_role" "elastic_beanstalk_service" {
  name               = "${var.elastic_beanstalk_environment_name}-service-role"
  assume_role_policy = data.aws_iam_policy_document.elastic_beanstalk_service_assume_role.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "elastic_beanstalk_service_enhanced_health" {
  role       = aws_iam_role.elastic_beanstalk_service.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth"
}


data "aws_iam_policy_document" "elastic_beanstalk_ec2_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      identifiers = ["ec2.amazonaws.com"]
      type        = "Service"
    }
  }
}

resource "aws_iam_role" "elastic_beanstalk_ec2" {
  name               = "${var.elastic_beanstalk_environment_name}-ec2-role"
  assume_role_policy = data.aws_iam_policy_document.elastic_beanstalk_ec2_assume_role.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "elastic_beanstalk_web_tier" {
  role       = aws_iam_role.elastic_beanstalk_ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier"
}

resource "aws_iam_role_policy_attachment" "elastic_beanstalk_ssm" {
  role       = aws_iam_role.elastic_beanstalk_ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "elastic_beanstalk_ec2" {
  name = "${var.elastic_beanstalk_environment_name}-instance-profile"
  role = aws_iam_role.elastic_beanstalk_ec2.name
}

resource "aws_elastic_beanstalk_application" "web" {
  description = "Parqara full-stack web application."
  name        = var.elastic_beanstalk_application_name

  tags = local.common_tags
}

resource "aws_elastic_beanstalk_environment" "web" {
  application            = aws_elastic_beanstalk_application.web.name
  cname_prefix           = var.elastic_beanstalk_cname_prefix
  name                   = var.elastic_beanstalk_environment_name
  solution_stack_name    = data.aws_elastic_beanstalk_solution_stack.nodejs.name
  wait_for_ready_timeout = "20m"

  tags = local.common_tags

  setting {
    name      = "EnvironmentType"
    namespace = "aws:elasticbeanstalk:environment"
    value     = "SingleInstance"
  }

  setting {
    name      = "ServiceRole"
    namespace = "aws:elasticbeanstalk:environment"
    value     = aws_iam_role.elastic_beanstalk_service.name
  }

  setting {
    name      = "SystemType"
    namespace = "aws:elasticbeanstalk:healthreporting:system"
    value     = "enhanced"
  }

  setting {
    name      = "Application Healthcheck URL"
    namespace = "aws:elasticbeanstalk:application"
    value     = "/api/health"
  }

  setting {
    name      = "HealthCheckPath"
    namespace = "aws:elasticbeanstalk:environment:process:default"
    value     = "/api/health"
  }

  setting {
    name      = "DeploymentPolicy"
    namespace = "aws:elasticbeanstalk:command"
    value     = "AllAtOnce"
  }

  setting {
    name      = "InstanceType"
    namespace = "aws:autoscaling:launchconfiguration"
    value     = var.elastic_beanstalk_instance_type
  }

  setting {
    name      = "IamInstanceProfile"
    namespace = "aws:autoscaling:launchconfiguration"
    value     = aws_iam_instance_profile.elastic_beanstalk_ec2.name
  }

  setting {
    name      = "SecurityGroups"
    namespace = "aws:autoscaling:launchconfiguration"
    value     = aws_security_group.elastic_beanstalk_instance.id
  }

  setting {
    name      = "MinSize"
    namespace = "aws:autoscaling:asg"
    value     = "1"
  }

  setting {
    name      = "MaxSize"
    namespace = "aws:autoscaling:asg"
    value     = "1"
  }

  setting {
    name      = "VPCId"
    namespace = "aws:ec2:vpc"
    value     = local.vpc_id
  }

  setting {
    name      = "Subnets"
    namespace = "aws:ec2:vpc"
    value     = join(",", local.elastic_beanstalk_subnet_ids)
  }

  setting {
    name      = "AssociatePublicIpAddress"
    namespace = "aws:ec2:vpc"
    value     = "true"
  }

  dynamic "setting" {
    for_each = var.ec2_key_name != null ? { key_name = var.ec2_key_name } : {}

    content {
      name      = "EC2KeyName"
      namespace = "aws:autoscaling:launchconfiguration"
      value     = setting.value
    }
  }

  lifecycle {
    precondition {
      condition     = length(local.elastic_beanstalk_subnet_ids) > 0
      error_message = "No compatible subnets were found for the selected Elastic Beanstalk instance type. Provide subnet_ids in supported availability zones or change elastic_beanstalk_instance_type."
    }
  }

  dynamic "setting" {
    for_each = local.eb_environment_variables

    content {
      name      = setting.key
      namespace = "aws:elasticbeanstalk:application:environment"
      value     = setting.value
    }
  }
}

