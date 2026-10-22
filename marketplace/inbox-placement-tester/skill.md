# Inbox Placement Tester

Test inbox placement rates across major providers.

## Inputs

- `reputation-scores`: Current reputation scores
- `sending-domain`: The sending domain

## Outputs

- `placement-results`: Inbox vs. spam vs. missing placement rates for Gmail, Outlook, Yahoo, and others
- `content-flags`: Content elements that triggered spam filters in testing

## Process

1. Send test emails to seed accounts across Gmail, Outlook, Yahoo, and Apple Mail.
2. Check where each test email landed (inbox, promotions tab, spam, not delivered).
3. Identify content patterns that correlate with spam placement (trigger words, link density, image-to-text ratio).
4. Record the placement rates and content flags.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
