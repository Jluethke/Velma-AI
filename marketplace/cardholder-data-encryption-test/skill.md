# Cardholder Data Encryption Test

Test encryption of cardholder data in transit and at rest across all systems in the CDE.

## Inputs

- `data-flow-map`: Cardholder data flow map
- `encryption-policy`: Organization encryption standards and key management policy

## Outputs

- `encryption-findings`: Gaps in cardholder data encryption
- `key-management-findings`: Key management weaknesses

## Process

1. Test TLS configuration on all channels carrying cardholder data (version, cipher suites, certificate validation)
2. Check at-rest encryption for databases, logs, backups, and file stores containing card data
3. Review key management (generation, storage, rotation, destruction) against PCI requirements
4. Test for card data appearing in logs, error messages, or debugging output

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
