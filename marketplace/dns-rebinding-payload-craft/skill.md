# Dns Rebinding Payload Craft

Craft DNS rebinding payloads that target specific internal endpoints after the DNS switch.

## Inputs

- `rebinding-domain-config`: DNS configuration for the rebinding domain
- `service-fingerprints`: Fingerprints of target internal services

## Outputs

- `rebinding-payloads`: Collection of crafted rebinding payloads
- `payload-target-map`: Mapping of each payload to its target service

## Process

1. Design payloads for each target internal service
2. Include timing logic to account for DNS cache expiry
3. Build JavaScript handlers to exploit the rebinding window

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
