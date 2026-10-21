# Dns Dangling Record Scan

Identify dangling DNS records pointing to deprovisioned resources that could enable subdomain takeover.

## Inputs

- `dns-record-inventory`: Complete DNS record inventory
- `target-domains`: In-scope domains

## Outputs

- `dangling-records`: DNS records pointing to unclaimed or deprovisioned resources
- `takeover-risk-assessment`: Assessment of subdomain takeover feasibility for each dangling record

## Process

1. Resolve all CNAME records and check if the target still exists
2. Check A/AAAA records for IP addresses no longer under the organization's control
3. Test cloud service endpoints (S3, Azure Blob, GitHub Pages, Heroku) for claimability
4. Classify each dangling record by takeover difficulty and impact

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
