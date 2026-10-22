# Cdn Ssl Configurator

Set up the CDN and SSL certificate.

## Inputs

- `dns-records`: DNS records configured
- `domain-registration`: Domain details

## Outputs

- `cdn-config`: CDN configured and caching rules set
- `ssl-config`: SSL certificate installed and HTTPS enforced

## Process

1. Set up the CDN provider and point DNS to its edge servers.
2. Configure caching rules for static assets.
3. Issue and install the SSL certificate.
4. Enforce HTTPS with redirect rules.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
