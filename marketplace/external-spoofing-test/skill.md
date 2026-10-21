# External Spoofing Test

Attempt to send spoofed emails from external addresses impersonating the target domain.

## Inputs

- `target-domain`: Domain to spoof
- `dmarc-assessment`: DMARC policy and enforcement level

## Outputs

- `external-spoof-results`: Whether spoofed emails from external sources are delivered
- `delivery-path-analysis`: How spoofed messages are handled at each mail hop

## Process

1. Send test messages from an unauthorized server using the target domain in From:
2. Check delivery status (inbox, spam, rejected) at multiple test recipients
3. Analyze Authentication-Results headers on delivered messages
4. Test with and without a valid reply-to to assess behavioral filtering

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
