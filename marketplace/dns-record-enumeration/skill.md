# Dns Record Enumeration

Enumerate all DNS records and zones for the target domains.

## Inputs

- `target-domains`: List of domains and subdomains in scope
- `dns-provider-access`: Access to DNS management console or API if available

## Outputs

- `dns-record-inventory`: Complete inventory of DNS records by type and zone
- `zone-list`: List of all DNS zones under management

## Process

1. Query all standard record types (A, AAAA, CNAME, MX, TXT, SRV, NS, SOA) for each domain
2. Perform subdomain discovery using certificate transparency logs and passive DNS
3. Document nameserver delegations and zone boundaries
4. Identify wildcard records and their scope

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
