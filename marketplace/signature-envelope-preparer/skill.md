# Signature Envelope Preparer

Prepare the document for signing: define signing order, roles, and signature fields.

## Inputs

- `document-to-sign`: The document that needs signatures
- `signing-parties`: Who signs, in what order, and what role each plays (signer, approver, observer)

## Outputs

- `prepared-envelope`: The document configured with signature fields, signing order, and recipient roles
- `signing-instructions`: Instructions for each signer on what to do

## Process

1. Place signature, initial, and date fields at the correct positions in the document.
2. Define the signing order (sequential or parallel).
3. Assign roles to each recipient (signer, approver, carbon copy, observer).
4. Set expiration date and reminder frequency.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
