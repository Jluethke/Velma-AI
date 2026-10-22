# Consent Mechanism Implementation

Implement the consent collection mechanism (banner, preference center).

## Inputs

- `consent-categories`: The defined consent categories
- `legal-basis-mapping`: Legal basis for each processing activity

## Outputs

- `consent-mechanism-spec`: Specification of the consent banner and preference center design
- `implementation-checklist`: Checklist of technical requirements for consent collection and enforcement

## Process

1. Design the consent banner (first visit experience, category toggles, accept/reject buttons).
2. Design the preference center where users can review and change consent at any time.
3. Define the technical behavior: block non-essential scripts until consent is given, re-check on consent change.
4. Specify the consent record format (timestamp, categories, version, user ID).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
