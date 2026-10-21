# External Asset Discoverer

Discover all externally reachable assets including domains, IPs, cloud resources, and APIs.

## Inputs

- `known-domains`: Root domains and known subdomains owned by the organization
- `cloud-accounts`: AWS, Azure, and GCP account identifiers

## Outputs

- `discovered-assets`: Complete list of external assets with IP, domain, service, and owner
- `asset-fingerprints`: Technology stack and version information for each asset

## Process

1. Enumerate subdomains via DNS brute force, certificate transparency, and passive DNS
2. Scan IP ranges for exposed services
3. Query cloud provider APIs for public-facing resources (S3 buckets, storage accounts, GCS buckets, load balancers)
4. Fingerprint each asset: web server, framework, TLS version, open ports

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
