# Active Network Scanning

Actively scan authorized IP ranges and ports to discover live hosts and running services.

## Inputs

- `scope-document`: Authorized IP ranges and domains
- `domain-enumeration`: Discovered subdomains and DNS records from passive recon

## Outputs

- `host-inventory`: Live hosts with open ports and detected operating systems
- `service-fingerprints`: Running services with version information
- `scan-artifacts`: Raw scan output files for evidence preservation

## Process

1. Run port scans against authorized IP ranges using TCP SYN and UDP scanning
2. Fingerprint operating systems through TCP/IP stack analysis
3. Identify running services and their versions through banner grabbing and probing
4. Document all scan results with timestamps for the evidence chain

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
