# Consent Mechanism Auditor

Audit how consent is collected and recorded to verify compliance.

## Inputs

- `applicable-regulations`: Regulations that apply
- `compliance-checklist`: Requirements to verify

## Outputs

- `consent-audit-results`: Status of each consent mechanism: compliant, non-compliant, needs improvement
- `consent-fixes`: Specific changes needed to consent forms, records, and processes

## Process

1. Review all opt-in forms for proper consent language (explicit consent for GDPR, opt-out for CAN-SPAM).
2. Verify that consent records include timestamp, source, and the text the subscriber agreed to.
3. Check that the unsubscribe mechanism works, is easy to find, and processes within the required timeframe.
4. List the fixes needed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
