# Unsubscribe Mechanism Builder

Build the unsubscribe mechanism to meet all regulatory requirements.

## Inputs

- `consent-framework`: The consent requirements
- `regulation-applicability`: Applicable regulations

## Outputs

- `unsubscribe-spec`: The unsubscribe mechanism specification (one-click, preference center, confirmation page)
- `processing-timeline`: The unsubscribe processing timeline and verification procedure

## Process

1. Implement the one-click unsubscribe header (RFC 8058, required by Gmail and Yahoo since 2024).
2. Design the preference center (unsubscribe from specific types vs. all).
3. Set the processing timeline (CAN-SPAM allows 10 business days; best practice is immediate).
4. Test the full unsubscribe flow from link click through suppression.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
