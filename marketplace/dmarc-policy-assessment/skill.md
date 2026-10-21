# Dmarc Policy Assessment

Assess DMARC policy enforcement level and reporting configuration.

## Inputs

- `spf-analysis`: SPF analysis results
- `dkim-analysis`: DKIM analysis results

## Outputs

- `dmarc-assessment`: DMARC policy level, alignment mode, and reporting setup
- `policy-gaps`: Gaps in DMARC enforcement (p=none, sp mismatch, pct < 100)

## Process

1. Retrieve and parse the DMARC record for the domain and organizational domain
2. Check the policy level (none, quarantine, reject) and percentage applied
3. Verify subdomain policy (sp=) matches the organizational policy
4. Check for aggregate (rua) and forensic (ruf) report receivers

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
