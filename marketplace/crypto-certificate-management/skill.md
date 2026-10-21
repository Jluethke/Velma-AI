# Crypto Certificate Management

Review certificate management including issuance, renewal, revocation checking, and trust store configuration.

## Inputs

- `crypto-inventory`: Inventory including TLS configurations
- `standards-findings`: Algorithm standards compliance findings

## Outputs

- `certificate-findings`: Certificate management weaknesses and misconfigurations
- `trust-store-assessment`: Assessment of certificate trust store configuration

## Process

1. Check certificate validity, key sizes, and signature algorithms
2. Review certificate renewal automation and monitoring
3. Test revocation checking (CRL, OCSP, OCSP stapling) in both servers and clients
4. Check certificate pinning implementations where applicable

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
