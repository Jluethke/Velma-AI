# Email Antispam Configurator

Configure anti-spam and anti-malware scanning for inbound and outbound mail.

## Inputs

- `domain-name`: The email domain
- `relay-config`: Relay settings already applied

## Outputs

- `antispam-config`: Applied anti-spam and anti-malware settings
- `filter-test-results`: Results of test messages through the filters

## Process

1. Configure spam filtering (SpamAssassin, rspamd, or equivalent)
2. Configure antivirus scanning (ClamAV or equivalent)
3. Set up DNSBL checks against known spam sources
4. Test with EICAR test files and known spam patterns

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
