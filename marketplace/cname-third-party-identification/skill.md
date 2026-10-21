# Cname Third Party Identification

Identify CNAME records pointing to third-party services that may be claimable.

## Inputs

- `subdomain-list`: Enumerated subdomains
- `dns-record-map`: DNS records for each subdomain

## Outputs

- `third-party-cnames`: CNAME records pointing to third-party services
- `service-status-map`: Claim status for each third-party service endpoint

## Process

1. Filter for CNAME records pointing to known cloud and SaaS providers
2. Check each CNAME target for common takeover-vulnerable services (GitHub Pages, Heroku, S3, Azure, Shopify)
3. Resolve each CNAME chain to its final destination
4. Classify each as active, dangling (NXDOMAIN), or error (service-specific 404)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
