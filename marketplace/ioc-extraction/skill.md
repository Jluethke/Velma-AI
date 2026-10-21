# Ioc Extraction

Extract all indicators of compromise from the analysis.

## Inputs

- `static-indicators`: Static analysis findings
- `behavioral-log`: Dynamic analysis findings
- `c2-infrastructure`: C2 details

## Outputs

- `ioc-list`: Complete list of IOCs: hashes, IPs, domains, file paths, registry keys
- `detection-signatures`: YARA rules, Snort signatures, or other detection content

## Process

1. Compile file hashes: MD5, SHA-1, SHA-256 of all components
2. List network indicators: IP addresses, domains, URLs, user agents
3. List host indicators: file paths, registry modifications, mutex names
4. Write detection signatures: YARA rules for file detection, network signatures for traffic

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
