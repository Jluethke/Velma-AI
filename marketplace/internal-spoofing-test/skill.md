# Internal Spoofing Test

Test for internal-to-internal email spoofing within the organization's mail system.

## Inputs

- `target-domain`: Organization's email domain
- `external-spoof-results`: External spoofing test results

## Outputs

- `internal-spoof-results`: Whether internal spoofing bypasses authentication checks
- `internal-trust-assessment`: Assessment of internal mail trust assumptions

## Process

1. Test whether internal mail servers enforce SPF/DKIM/DMARC on internal messages
2. Check for trusted IP ranges that bypass authentication
3. Test for spoofing from shared infrastructure (printers, applications, internal tools)
4. Assess whether internal users see authentication indicators on messages

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
