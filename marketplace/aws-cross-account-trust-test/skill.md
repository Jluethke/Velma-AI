# Aws Cross Account Trust Test

Test cross-account trust relationships for abuse potential.

## Inputs

- `trust-relationship-map`: Cross-account role trust policies
- `escalation-results`: Access achieved in the target account

## Outputs

- `cross-account-findings`: Cross-account trust abuse paths found
- `blast-radius-assessment`: Impact of compromising the cross-account trust chain

## Process

1. Test role assumption across account boundaries using discovered trust relationships
2. Check for overly broad trust policies (allowing any principal in the trusted account)
3. Assess the permissions available in trusted accounts through assumed roles
4. Map the blast radius if the cross-account chain is compromised

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
