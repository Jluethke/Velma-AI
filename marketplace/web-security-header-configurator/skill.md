# Web Security Header Configurator

Configure security response headers to protect against common web attacks.

## Inputs

- `web-server-type`: Web server software
- `application-requirements`: Application-specific header needs (CSP sources, framing)

## Outputs

- `header-config`: Applied security header configuration
- `header-test-results`: Verification of headers in the HTTP response

## Process

1. Configure Content-Security-Policy with appropriate source directives
2. Set Strict-Transport-Security (HSTS) with a minimum one-year max-age
3. Set X-Frame-Options, X-Content-Type-Options, and Referrer-Policy
4. Test the response headers with a browser or command-line tool

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
