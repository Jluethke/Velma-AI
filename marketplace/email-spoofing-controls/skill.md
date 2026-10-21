# Email Spoofing Controls

Test anti-spoofing controls by sending test messages with forged headers and domains.

## Inputs

- `auth-record-findings`: SPF/DKIM/DMARC configuration findings
- `target-domains`: Domains to test spoofing against

## Outputs

- `spoofing-results`: Results of spoofing tests showing which forgeries succeed
- `header-analysis`: Analysis of how spoofed messages are marked in headers

## Process

1. Send test messages spoofing the target domain from an external server
2. Test display-name spoofing with legitimate-looking sender names
3. Check whether DMARC policy is enforced (quarantine or reject) on receiving side
4. Analyze authentication-results headers on delivered test messages

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
