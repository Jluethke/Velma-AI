# Security Capability Gap Assessor

Inventory current security capabilities and identify gaps against the target state.

## Inputs

- `current-security-stack`: Current security tools, staffing, and processes
- `target-security-framework`: Framework or maturity model to measure against (NIST CSF, CIS, ISO 27001)

## Outputs

- `capability-gap-list`: Gaps between current state and target, categorized by domain
- `current-maturity-scores`: Maturity rating for each domain in the target framework

## Process

1. Map current tools and processes to framework domains
2. Score each domain on a maturity scale (initial, managed, defined, measured, optimized)
3. Identify gaps where the current maturity falls below the target
4. Categorize gaps as tool, staffing, or process deficiencies

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
