# Dns Dnssec Check

Test DNSSEC configuration for proper signing, chain of trust, and key management.

## Inputs

- `zone-list`: DNS zones to check
- `dns-record-inventory`: DNS record inventory

## Outputs

- `dnssec-assessment`: DNSSEC deployment status and configuration quality per zone
- `chain-of-trust-results`: Validation results for the DNSSEC chain of trust

## Process

1. Check whether DNSSEC is deployed for each zone
2. Validate the chain of trust from root to each signed zone
3. Check key sizes, algorithms, and rotation schedules
4. Test for NSEC vs NSEC3 zone walking exposure

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
