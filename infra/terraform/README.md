# Parqara Terraform

This stack provisions the low-cost AWS shape for the current Parqara architecture:

- one Elastic Beanstalk web environment
- one PostgreSQL RDS instance
- one EBS service role
- one EBS EC2 instance profile
- security groups for app and database traffic

It matches the same broad AWS pattern you are already using on ByteRecipes, but keeps Parqara to a single web environment because the API still lives inside the same Next.js app.

## Cost-first defaults

The defaults are intentionally conservative for an app with fewer than five testers:

- `Elastic Beanstalk`: `t3.small`
- `RDS`: `db.t4g.micro`
- `SingleInstance` Elastic Beanstalk environment
- `Single-AZ` PostgreSQL
- default VPC and existing subnets
- no NAT, no custom VPC build-out, no load balancer

Tradeoff: this keeps cost down, but it also means no autoscaling and no managed HTTPS load balancer by default.

## Files

- `versions.tf`: Terraform and provider requirements
- `variables.tf`: all tunable inputs
- `main.tf`: core AWS resources
- `outputs.tf`: environment and database outputs
- `terraform.tfvars.example`: a starter config

## Usage

1. Copy the example vars:

   ```bash
   copy infra\\terraform\\terraform.tfvars.example infra\\terraform\\terraform.tfvars
   ```

2. Edit `terraform.tfvars` with your naming and any app integrations you want enabled up front.

3. Apply the infrastructure:

   ```bash
   cd infra\\terraform
   terraform init
   terraform plan
   terraform apply
   ```

4. Capture the temporary app URL:

   ```bash
   terraform output elastic_beanstalk_cname
   terraform output suggested_next_public_app_url
   ```

5. If you want Google OAuth or email-link auth immediately, add that `suggested_next_public_app_url` value as `app_url` in `terraform.tfvars` and run `terraform apply` again. Set `next_public_app_url` too only if you need a matching public browser-facing origin.

6. Build the upload bundle from the repo root:

   ```bash
   npm run bundle:eb
   ```

7. Upload `dist/parqara-web-eb.zip` through the Elastic Beanstalk UI.

## What Terraform configures in Elastic Beanstalk

Terraform sets the minimum runtime configuration the app needs to boot:

- `DATABASE_URL`
- `SESSION_SECRET`
- `NODE_ENV=production`
- `PREVIEW_GATE_ENABLED`
- `PREVIEW_GATE_PASSWORD`
- `SKIP_DB_BOOTSTRAP`
- `APP_URL` if you provide it`r`n- `NEXT_PUBLIC_APP_URL` if you provide it
- anything else in `application_environment`

That means Google, Postmark, OpenAI, Stripe, Sentry, PostHog, and Mapbox can all be added later through the same `application_environment` map without changing the infrastructure shape.

## Notes

- This stack assumes the default VPC exists. If your AWS account has no default VPC, supply `vpc_id` and `subnet_ids`.
- The RDS password and session secret are auto-generated if you do not provide them. They are stored in Terraform state.
- The RDS instance is configured for easy tear-down: `skip_final_snapshot = true` and `deletion_protection = false`. Change those before using this for a long-lived production environment.
- Elastic Beanstalk creates the environment before the final app zip is uploaded. The zip upload remains a manual step, which matches your current ByteRecipes workflow.
- If Parqara is later split into separate deployable `web` and `api` apps, this stack can be duplicated for a second Elastic Beanstalk environment.


