# Email Message Limit Setter

Set message size limits and rate controls to prevent abuse.

## Inputs

- `domain-name`: The email domain
- `antispam-config`: Anti-spam settings already applied

## Outputs

- `limit-config`: Applied message size and rate limits
- `limit-test-results`: Verification that limits are enforced

## Process

1. Set maximum message size (including attachments)
2. Configure per-user and per-IP sending rate limits
3. Set maximum recipients per message
4. Test enforcement with oversized messages and rapid sending

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
