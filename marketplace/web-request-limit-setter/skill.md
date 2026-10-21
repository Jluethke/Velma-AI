# Web Request Limit Setter

Configure request size limits, timeouts, and rate limiting to prevent abuse.

## Inputs

- `web-server-type`: Web server software
- `application-requirements`: Maximum expected request sizes and rates

## Outputs

- `limit-config`: Applied request limits and timeout settings
- `limit-test-results`: Verification that oversized or excessive requests are rejected

## Process

1. Set maximum request body size based on application needs
2. Configure connection and request timeouts
3. Set up rate limiting per IP address or authentication token
4. Test with oversized and high-volume requests to verify enforcement

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
