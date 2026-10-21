# Subdomain Enumeration

Enumerate all subdomains using DNS brute force, certificate transparency, and passive sources.

## Inputs

- `target-domain`: Root domain of the authorized target
- `engagement-scope`: Written authorization and scope document

## Outputs

- `subdomain-list`: All discovered subdomains with resolution status
- `dns-record-map`: DNS record types (A, AAAA, CNAME, NS, MX) for each subdomain

## Process

1. Run DNS brute force with a curated wordlist against the target domain
2. Query certificate transparency logs for historically issued certificates
3. Check passive DNS databases and search engine caches for subdomains
4. Resolve all discovered subdomains and record their DNS records

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
