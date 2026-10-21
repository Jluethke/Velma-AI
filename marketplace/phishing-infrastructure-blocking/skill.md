# Phishing Infrastructure Blocking

Block the phishing infrastructure across all defensive layers.

## Inputs

- `ioc-list`: URLs, domains, IPs, and hashes to block
- `reset-log`: Confirmation that affected accounts are secured

## Outputs

- `block-confirmation`: Record of all blocks applied across systems
- `detection-rules`: New detection rules created for this campaign

## Process

1. Block phishing domains and IPs at the firewall and web proxy
2. Add file hashes to endpoint detection blocklists
3. Create mail transport rules to quarantine matching future emails
4. Write detection rules for the phishing campaign TTPs

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
