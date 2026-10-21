# Display Name Spoofing Test

Test for display name spoofing and lookalike domain attacks in email clients.

## Inputs

- `target-domain`: Target domain and key personnel names
- `internal-spoof-results`: Internal spoofing test results

## Outputs

- `display-name-results`: Display name spoofing effectiveness in target email clients
- `lookalike-domain-risk`: Available lookalike domains that could be used for impersonation

## Process

1. Send messages with spoofed display names matching executives from a different domain
2. Check how different email clients (Outlook, Gmail, mobile) display the sender
3. Search for available lookalike domains (homograph, typosquat, TLD variants)
4. Assess whether external email banners or sender verification badges are present

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
