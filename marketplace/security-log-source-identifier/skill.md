# Security Log Source Identifier

Identify all log and telemetry sources to ingest into the security data lake.

## Inputs

- `infrastructure-inventory`: Servers, network devices, cloud accounts, applications, and security tools
- `detection-requirements`: Use cases the data lake must support (threat hunting, compliance, forensics)

## Outputs

- `source-catalog`: All log sources with format, volume, and retention requirements
- `volume-estimates`: Estimated daily ingestion volume in GB per source

## Process

1. Catalog all log sources: firewalls, endpoints, cloud trail, application logs, identity providers, email gateways
2. Document each source's format (syslog, JSON, CEF, CSV, proprietary)
3. Estimate daily volume for each source
4. Map each source to the detection use cases it supports

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
