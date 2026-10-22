# Sanctions Party Collector

Collect party details for sanctions screening.

## Inputs

- `party-details`: Name, address, country, and identifiers of the party
- `transaction-context`: Description of the transaction or relationship

## Outputs

- `screening-request`: Formatted screening request with all party identifiers
- `applicable-lists`: Sanctions lists applicable based on jurisdiction

## Process

1. Collect all known identifiers (names, aliases, addresses, dates of birth, entity numbers).
2. Determine which sanctions lists apply based on the jurisdictions involved.
3. Format the screening request with all identifiers and variations.
4. Submit for screening.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
