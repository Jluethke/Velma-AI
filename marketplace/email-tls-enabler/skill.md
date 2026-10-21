# Email Tls Enabler

Enable TLS encryption for all email connections (STARTTLS and MTA-STS).

## Inputs

- `domain-name`: The email domain
- `dns-records`: DNS records already configured

## Outputs

- `tls-config`: Applied TLS configuration for the mail server
- `mta-sts-policy`: MTA-STS policy published for the domain

## Process

1. Install a valid TLS certificate on the mail server
2. Enable STARTTLS for SMTP, IMAPS, and POP3S
3. Publish an MTA-STS policy to require TLS from sending servers
4. Test encrypted delivery with external mail servers

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
