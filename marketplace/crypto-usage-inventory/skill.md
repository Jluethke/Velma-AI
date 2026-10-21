# Crypto Usage Inventory

Inventory all cryptographic usage across the codebase and infrastructure including algorithms, key sizes, and purposes.

## Inputs

- `codebase-access`: Access to source code repositories
- `scope-definition`: Which systems and code are in scope for the review

## Outputs

- `crypto-inventory`: Catalog of all cryptographic operations, algorithms, and key sizes in use
- `crypto-dependency-list`: List of cryptographic libraries and their versions

## Process

1. Search codebase for cryptographic API calls (encryption, hashing, signing, key derivation, random number generation)
2. Identify TLS/SSL configurations in servers and clients
3. Catalog key sizes and algorithm choices for each usage
4. List all cryptographic library dependencies and their versions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
