# Sbom Enrichment Engine

Enrich the SBOM with license compliance data and known vulnerability information from CVE databases.

## Inputs

- `sbom-document`: SBOM in CycloneDX or SPDX format
- `dependency-metadata`: Version, license, and source URL for each dependency

## Outputs

- `enriched-sbom`: SBOM with vulnerability and license annotations per component
- `risk-summary`: Summary of known vulnerabilities and license compliance issues

## Process

1. Query CVE databases (NVD, OSV) for known vulnerabilities matching each component and version.
2. Classify licenses and flag any that conflict with organizational policy.
3. Annotate each SBOM entry with vulnerability and license findings.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
