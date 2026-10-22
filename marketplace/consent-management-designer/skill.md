# Consent Management Designer

Design the consent collection and management system.

## Inputs

- `regulation-applicability`: Which regulations apply
- `compliance-gaps`: The gaps to fix

## Outputs

- `consent-framework`: Consent collection requirements per regulation (opt-in type, proof of consent, retention period)
- `consent-ux-specs`: UX specifications for consent collection (form language, checkbox behavior, confirmation flow)

## Process

1. For each applicable regulation, document the consent standard required (express consent, implied consent, opt-out).
2. Design the consent collection UX: unchecked checkboxes for GDPR, clear language, granular preferences.
3. Design the consent record: what to store (timestamp, IP, form version, exact language consented to).
4. Design the consent withdrawal (unsubscribe) flow meeting the strictest applicable standard.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
