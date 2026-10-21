# Osint Reconnaissance Collector

Gather open-source intelligence on the target to inform attack planning.

## Inputs

- `scope-document`: Formal scope with targets
- `target-description`: Description of the target

## Outputs

- `osint-report`: Collected intelligence organized by category
- `attack-surface-map`: External-facing assets, domains, IPs, and services discovered

## Process

1. Enumerate domains, subdomains, and IP ranges from DNS and certificate transparency logs
2. Collect employee names, roles, and email formats from public sources
3. Identify exposed services, technologies, and version information
4. Map the external attack surface and note potential entry points

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
