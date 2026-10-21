# Email Spf Dkim Dmarc Configurator

Configure SPF, DKIM, and DMARC records for email authentication.

## Inputs

- `domain-name`: The email domain to configure
- `mail-server-ip`: IP addresses of authorized mail servers

## Outputs

- `dns-records`: SPF, DKIM, and DMARC DNS records to publish
- `dkim-keys`: DKIM signing keys generated for the domain

## Process

1. Create the SPF TXT record listing all authorized sending IPs
2. Generate DKIM signing keys and publish the public key as a DNS TXT record
3. Create the DMARC record starting with p=none for monitoring, then tightening to quarantine or reject
4. Verify all three records resolve correctly from external DNS

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
