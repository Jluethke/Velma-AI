# Certificate Renewal Automator

Set up automated certificate renewal using ACME protocol or internal CA integration.

## Inputs

- `certificate-inventory`: All certificates and their current renewal method
- `infrastructure-scope`: Where certificates are deployed

## Outputs

- `automation-configuration`: ACME client or CA integration configuration for each certificate
- `manual-renewal-list`: Certificates that cannot be automated with the renewal procedure documented

## Process

1. Classify certificates by renewal method (ACME eligible, CA managed, manual)
2. Configure ACME clients (certbot, acme.sh) for eligible certificates
3. Set up cloud-native auto-renewal for managed certificates
4. Document manual renewal procedures for the remainder

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
