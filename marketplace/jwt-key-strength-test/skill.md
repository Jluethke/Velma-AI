# Jwt Key Strength Test

Test for weak signing keys through brute force and known key attacks.

## Inputs

- `decoded-tokens`: Captured tokens with signatures
- `algorithm-confusion-results`: Algorithm confusion test results

## Outputs

- `key-strength-results`: Results of key brute force and known key attacks
- `recovered-key`: Signing key if recovered through brute force

## Process

1. If HS256, attempt brute force with common secret wordlists
2. Check for known default keys from popular frameworks and libraries
3. If kid header is present, test for key injection through kid manipulation
4. Test for jwk and jku header injection to supply an attacker-controlled key

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
