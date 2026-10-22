# Call Recording Compliance Checker

Audit the call recording practices for legal compliance.

## Inputs

- `recording-policy`: Current call recording policy and practices
- `operating-jurisdictions`: Jurisdictions where calls are made or received

## Outputs

- `recording-audit`: Audit findings on recording consent compliance (one-party vs two-party consent, notification, opt-out)
- `consent-gaps`: Gaps between current practices and legal requirements

## Process

1. Identify the consent requirements for each jurisdiction (one-party consent, two-party consent, all-party consent).
2. Audit the current notification practices (is the caller told the call is recorded, when, how).
3. Check whether opt-out is available where required.
4. Check the recording retention period against legal requirements.
5. Document the gaps.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
