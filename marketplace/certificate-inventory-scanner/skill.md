# Certificate Inventory Scanner

Inventory all TLS and PKI certificates across the organization with their expiration dates, issuers, and locations.

## Inputs

- `infrastructure-scope`: Domains, IP ranges, cloud accounts, and internal services to scan
- `known-certificates`: Any existing certificate inventory or tracking spreadsheet

## Outputs

- `certificate-inventory`: Complete list of certificates with subject, issuer, expiration, key size, and location
- `expiration-timeline`: Certificates sorted by expiration date with days remaining

## Process

1. Scan all external domains and subdomains for TLS certificates
2. Query cloud provider APIs for managed certificates (ACM, Cloud SSL, Key Vault)
3. Scan internal services and load balancers for certificates
4. Record subject, SAN entries, issuer, expiration, key algorithm, and key size

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
