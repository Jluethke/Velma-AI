# Dns Dnssec Enabler

Enable DNSSEC signing for authoritative zones.

## Inputs

- `dns-software`: DNS server software
- `zone-transfer-config`: Zone transfer settings already applied

## Outputs

- `dnssec-config`: Applied DNSSEC signing configuration
- `ds-records`: DS records to submit to the parent zone registrar

## Process

1. Generate the ZSK and KSK key pairs
2. Sign the zone with DNSSEC
3. Submit the DS records to the parent zone through the domain registrar
4. Verify DNSSEC validation with an external tool
5. Document the key rollover schedule

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
