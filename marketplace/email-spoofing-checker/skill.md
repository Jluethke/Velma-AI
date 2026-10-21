# Email Spoofing Checker

Check emails for spoofing indicators using SPF, DKIM, and DMARC results.

## Inputs

- `header-analysis`: Parsed email headers
- `origin-assessment`: Preliminary origin assessment

## Outputs

- `authentication-results`: SPF, DKIM, and DMARC verification results
- `spoofing-assessment`: Assessment of whether messages were spoofed

## Process

1. Verify SPF alignment between envelope sender and sending IP
2. Validate DKIM signatures against the signing domain's public key
3. Check DMARC alignment and policy for the From domain
4. Assess overall spoofing likelihood for each message

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
