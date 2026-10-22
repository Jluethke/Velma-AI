# Email Regulation Auditor

Audit current email practices against applicable regulations.

## Inputs

- `sending-regions`: Where recipients are located (US, EU, Canada, other)
- `current-practices`: Current email collection, sending, and unsubscribe practices

## Outputs

- `regulation-applicability`: Which regulations apply (CAN-SPAM, GDPR, CASL, ePrivacy) and why
- `compliance-gaps`: List of gaps between current practices and regulatory requirements

## Process

1. Determine which regulations apply based on sender location, recipient location, and business type.
2. Audit current consent collection against each regulation's requirements (opt-in vs. opt-out, explicit vs. implied).
3. Audit the unsubscribe mechanism (timing, ease, confirmation).
4. Audit data storage and retention practices against GDPR requirements.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
