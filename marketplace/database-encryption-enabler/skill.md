# Database Encryption Enabler

Enable encryption for data in transit (TLS) and at rest (TDE or filesystem encryption).

## Inputs

- `database-type`: Database product type
- `access-config`: Authentication settings already configured

## Outputs

- `encryption-config`: Applied encryption settings for transit and rest
- `certificate-info`: TLS certificate details and expiration date

## Process

1. Generate or install a TLS certificate for the database listener
2. Configure the database to require TLS for all client connections
3. Enable transparent data encryption or filesystem-level encryption for data files
4. Verify encrypted connections from client applications

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
