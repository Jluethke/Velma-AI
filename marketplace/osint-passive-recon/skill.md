# Osint Passive Recon

Perform passive reconnaissance using open source intelligence without touching target systems.

## Inputs

- `scope-document`: Authorized scope with target domains and IP ranges
- `authorization-record`: Signed authorization confirming passive recon is permitted

## Outputs

- `domain-enumeration`: Discovered subdomains, DNS records, and WHOIS data
- `certificate-inventory`: Certificates from CT logs with associated hostnames
- `public-exposure-map`: Publicly visible services, technologies, and metadata

## Process

1. Enumerate subdomains through DNS brute forcing, certificate transparency logs, and search engine dorking
2. Collect WHOIS records, ASN data, and IP allocation information
3. Identify publicly exposed technologies from HTTP headers, job postings, and code repositories
4. Map email addresses and employee information from public sources

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
