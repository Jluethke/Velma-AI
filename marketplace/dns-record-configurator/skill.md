# Dns Record Configurator

Configure all DNS records: A, CNAME, MX, TXT, SPF, DKIM, and DMARC.

## Inputs

- `domain-registration`: Domain registered and accessible
- `nameserver-config`: Current nameserver setup

## Outputs

- `dns-records`: All DNS records configured
- `email-routing`: MX, SPF, DKIM, and DMARC records configured for email

## Process

1. Set A or CNAME records pointing to the hosting provider.
2. Configure MX records for email delivery.
3. Add SPF, DKIM, and DMARC TXT records for email authentication.
4. Add any additional TXT records for service verification (Google, analytics).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
