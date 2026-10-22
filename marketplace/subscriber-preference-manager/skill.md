# Subscriber Preference Manager

Manage subscriber preferences and consent records.

## Inputs

- `segment-definitions`: Named subscriber segments
- `cleaned-list-size`: Current list size after cleaning

## Outputs

- `preference-center-spec`: Design for the subscriber preference center (frequency, topics, format)
- `consent-audit`: Audit of consent status across the list (opted-in, single opt-in, double opt-in, unknown)

## Process

1. Inventory the preference options to offer (email frequency, content topics, email format).
2. Audit the current consent status of all subscribers.
3. Design the preference center page.
4. Document the consent record retention policy.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
