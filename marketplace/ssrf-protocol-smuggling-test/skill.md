# Ssrf Protocol Smuggling Test

Test for SSRF through alternative protocols including gopher, file, and dict.

## Inputs

- `ssrf-surface-map`: SSRF-capable endpoints
- `metadata-access-results`: Cloud metadata access results

## Outputs

- `protocol-smuggling-results`: Alternative protocols accepted by the SSRF
- `smuggling-impact`: Impact assessment of protocol smuggling (Redis commands, file reads)

## Process

1. Test gopher:// for sending arbitrary TCP data (Redis, Memcached, SMTP commands)
2. Test file:// for reading local files from the server
3. Test dict:// for probing internal services
4. Assess the impact of each protocol access (code execution, data exfiltration)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
