# Service Identification

Identify services, versions, and configurations running on discovered hosts and open ports.

## Inputs

- `host-inventory`: Live hosts with open ports
- `network-topology`: Network topology context

## Outputs

- `service-inventory`: Services with versions and configurations per host
- `version-vulnerabilities`: Known CVEs matching identified service versions

## Process

1. Run service version detection probes on all open ports.
2. Grab banners and enumerate service configurations.
3. Cross-reference identified versions against CVE databases.
4. Identify default credentials and misconfigurations in exposed services.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
