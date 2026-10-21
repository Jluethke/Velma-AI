# Ssrf Filter Bypass Test

Test for bypasses around SSRF filters including allowlists, blocklists, and URL parsers.

## Inputs

- `ssrf-surface-map`: SSRF endpoints with known filtering
- `blind-ssrf-results`: Blind SSRF detection results

## Outputs

- `filter-bypass-results`: Successful filter bypass techniques
- `bypass-technique-catalog`: All techniques tested with pass/fail status

## Process

1. Test URL encoding and double encoding of internal addresses
2. Test DNS rebinding with a controlled domain resolving to internal IPs
3. Test IPv6 notation, decimal IP, and octal IP representations
4. Test URL parser confusion (backslash, at-sign, fragment, redirect chains)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
