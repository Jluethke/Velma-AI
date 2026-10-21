# Email Spf Dkim Dmarc Check

Check SPF, DKIM, and DMARC configurations for correctness and coverage.

## Inputs

- `target-domains`: Domains to check for email authentication records
- `email-system-info`: Known email infrastructure details (MX hosts, sending services)

## Outputs

- `auth-record-findings`: SPF, DKIM, and DMARC configuration issues
- `sending-source-map`: Map of all authorized sending sources per domain

## Process

1. Parse SPF records and check for overly broad includes, too many lookups, and missing sources
2. Verify DKIM key publication and key strength for each signing domain
3. Check DMARC policy (none, quarantine, reject), reporting URIs, and alignment settings
4. Identify third-party sending services not covered by SPF or DKIM

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
