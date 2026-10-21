# Security Advisory Preparer

Prepare the security advisory with CVE assignment and mitigation guidance.

## Inputs

- `cvss-score`: Severity scores
- `affected-versions`: All affected versions
- `fix-timeline`: Fix and release dates

## Outputs

- `security-advisory`: Public advisory text with CVE, description, affected versions, and fix
- `cve-id`: Assigned CVE identifier

## Process

1. Request a CVE identifier from the appropriate CNA
2. Write the advisory with description, impact, affected versions, and remediation
3. Include workarounds for users who cannot apply the fix immediately
4. Set the advisory publication date to align with fix availability

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
