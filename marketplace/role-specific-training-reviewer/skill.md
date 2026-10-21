# Role Specific Training Reviewer

Check whether role-specific security training exists for high-risk roles.

## Inputs

- `topic-coverage-matrix`: Topic coverage from content review
- `high-risk-groups`: Groups identified as high-risk

## Outputs

- `role-training-findings`: Findings on role-specific training coverage
- `missing-role-training`: Roles that need specialized training but lack it

## Process

1. Check for developer-specific training (secure coding, dependency management, secrets handling)
2. Check for administrator-specific training (privilege management, MFA enforcement, audit logging)
3. Check for executive-specific training (business email compromise, whale phishing, authority manipulation)
4. Identify roles with specialized access that have no tailored training program

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
