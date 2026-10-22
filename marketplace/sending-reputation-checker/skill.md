# Sending Reputation Checker

Check the sender reputation across blacklists and reputation services.

## Inputs

- `sending-domain`: The sending domain
- `auth-audit-results`: Authentication audit results for context

## Outputs

- `reputation-scores`: Reputation scores from major services (Google Postmaster Tools, Microsoft SNDS, Sender Score)
- `blacklist-status`: Blacklist check results across major blacklists

## Process

1. Check the domain and sending IPs against major blacklists (Spamhaus, Barracuda, SORBS, SpamCop).
2. Pull reputation data from Google Postmaster Tools if available.
3. Check Microsoft SNDS for IP reputation.
4. Compile scores and flag any blacklist entries requiring delisting requests.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
