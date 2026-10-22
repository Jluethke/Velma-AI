# Website Security Configurator

Configure SSL, security headers, and basic hardening before launch.

## Inputs

- `performance-report`: Performance test results
- `site-url`: The site URL

## Outputs

- `security-config`: SSL, headers, and security settings confirmed
- `security-checklist`: Checklist of security items verified

## Process

1. Verify SSL certificate is installed and all pages load over HTTPS.
2. Configure security headers (HSTS, X-Frame-Options, CSP, X-Content-Type-Options).
3. Ensure no sensitive files are publicly accessible (config files, .env, backups).
4. Set up HTTP-to-HTTPS redirects.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
