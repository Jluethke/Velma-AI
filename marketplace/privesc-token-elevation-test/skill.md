# Privesc Token Elevation Test

Test whether authentication tokens can be manipulated to elevate privileges.

## Inputs

- `vertical-findings`: Vertical escalation findings
- `role-permission-matrix`: Role and permission details

## Outputs

- `token-elevation-findings`: Token manipulation techniques that result in privilege elevation
- `token-validation-assessment`: Assessment of server-side token validation

## Process

1. Inspect JWT tokens for role claims and test modifications (algorithm confusion, claim editing)
2. Test session token predictability and forgeability
3. Check for privilege caching issues where a token retains old permissions after role changes
4. Test OAuth scope elevation by requesting higher scopes than authorized

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
