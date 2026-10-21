# Dictionary Rule Cracking

Run dictionary and rule-based cracking against the extracted hashes.

## Inputs

- `hash-collection`: Hashes to crack
- `hash-type-inventory`: Hash types for tool configuration

## Outputs

- `cracked-passwords`: Successfully cracked passwords with their hashes
- `cracking-statistics`: Time to crack, method that succeeded, and resistance metrics

## Process

1. Run dictionary attacks with common wordlists
2. Apply rule-based mutations: leetspeak, appended numbers, capitalization patterns
3. Run targeted attacks using organization-specific terms
4. Record time-to-crack for each password

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
