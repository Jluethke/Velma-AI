# Spf Record Analysis

Analyze SPF record coverage, strictness, and potential bypass conditions.

## Inputs

- `target-domain`: Email domain to assess
- `engagement-scope`: Written authorization and scope document

## Outputs

- `spf-analysis`: SPF record analysis including coverage gaps and lookup count
- `authorized-senders`: All IP ranges and services authorized to send for the domain

## Process

1. Retrieve and parse the SPF record, resolving all includes and redirects
2. Count DNS lookups (must be 10 or fewer to avoid permerror)
3. Check for overly permissive mechanisms (+all, broad IP ranges)
4. Identify services included in SPF that may allow arbitrary sending

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
