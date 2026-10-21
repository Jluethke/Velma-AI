# Waf Identification

Identify the WAF product, version, and configuration mode protecting the target.

## Inputs

- `target-url`: Base URL of the authorized target behind the WAF
- `engagement-scope`: Written authorization and scope document

## Outputs

- `waf-profile`: WAF product, version, and deployment mode identified
- `block-behavior`: How the WAF responds to blocked requests (status code, page, headers)

## Process

1. Send benign and known-malicious requests to fingerprint the WAF
2. Analyze error pages, response headers, and cookie names for product signatures
3. Determine deployment mode (inline, reverse proxy, CDN-integrated)
4. Document the block response pattern for reliable detection during testing

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
