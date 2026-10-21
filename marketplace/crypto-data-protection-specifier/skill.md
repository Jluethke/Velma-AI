# Crypto Data Protection Specifier

Specify encryption and data protection requirements for data at rest, in transit, and in use.

## Inputs

- `data-classification`: Each data type classified by sensitivity level
- `standards-requirements`: Security requirements derived from applicable standards

## Outputs

- `encryption-requirements`: Encryption requirements per data type and state (at rest, in transit, in use)
- `key-management-requirements`: Key management lifecycle requirements (generation, rotation, revocation)

## Process

1. Map each data sensitivity level to minimum encryption standards.
2. Specify encryption algorithms, key lengths, and protocols for each data state.
3. Define key management requirements including generation, storage, rotation, and revocation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
