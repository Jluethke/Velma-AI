# Dns Propagation Verifier

Verify DNS propagation and document the final configuration.

## Inputs

- `cdn-config`: CDN configured
- `email-routing`: Email DNS configured

## Outputs

- `propagation-status`: Verification that DNS has propagated globally
- `domain-setup-record`: Complete documentation of all DNS records, CDN settings, and SSL configuration

## Process

1. Check DNS propagation from multiple global locations.
2. Verify the site loads correctly over HTTPS.
3. Send a test email and verify delivery and authentication headers.
4. Document the full DNS configuration for the domain record.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
