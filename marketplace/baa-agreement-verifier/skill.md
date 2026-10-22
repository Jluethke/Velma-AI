# Baa Agreement Verifier

Verify that business associate agreements are in place for all vendors.

## Inputs

- `phi-systems`: Systems handling PHI
- `data-flow-map`: PHI flows including third parties

## Outputs

- `baa-inventory`: List of all business associates and their BAA status
- `baa-gaps`: Vendors handling PHI without a current BAA

## Process

1. Identify all vendors that access, store, or transmit PHI.
2. Verify that each has a signed, current BAA.
3. Flag vendors without BAAs or with expired agreements.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
