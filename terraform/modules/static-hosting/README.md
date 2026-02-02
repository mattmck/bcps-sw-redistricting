# Static Hosting Module (Cloud-Agnostic Interface)

This module provides a cloud-agnostic interface for deploying static web applications. The implementation uses Azure Static Web Apps, but the interface is designed to be easily adapted to other cloud providers.

## Usage

```hcl
module "static_hosting" {
  source = "./modules/static-hosting"
  
  app_name    = "my-app"
  environment = "prod"
  location    = "eastus"
  sku_tier    = "Free"
  
  tags = {
    Project = "My Project"
  }
}
```

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| `app_name` | Name of the application | `string` | n/a | yes |
| `environment` | Environment name | `string` | n/a | yes |
| `location` | Cloud provider region | `string` | n/a | yes |
| `sku_tier` | Service tier | `string` | `"Free"` | no |
| `resource_group_name` | Resource group name | `string` | auto-generated | no |
| `custom_domain` | Custom domain | `string` | `""` | no |
| `tags` | Resource tags | `map(string)` | `{}` | no |

## Outputs

| Name | Description |
|------|-------------|
| `hostname` | Application hostname |
| `url` | Full application URL |
| `deployment_token` | Token for deploying content |
| `resource_group_name` | Resource group name |

## Adapting to Other Cloud Providers

### AWS (S3 + CloudFront)

Replace the module implementation with:
- `aws_s3_bucket` for storage
- `aws_cloudfront_distribution` for CDN
- `aws_route53_record` for custom domains

### GCP (Cloud Storage + CDN)

Replace the module implementation with:
- `google_storage_bucket` for storage
- `google_compute_backend_bucket` + `google_compute_url_map` for CDN
- `google_dns_record_set` for custom domains

The module interface (inputs/outputs) remains the same.
