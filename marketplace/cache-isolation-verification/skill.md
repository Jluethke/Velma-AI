# Cache Isolation Verification

Verify that cache entries are properly isolated between users, roles, and geographic regions.

## Inputs

- `cache-topology`: Cache layers and configuration
- `cache-dos-results`: DoS test results

## Outputs

- `isolation-results`: Results of cross-user and cross-region cache isolation tests
- `cache-deception-findings`: Any cache deception vulnerabilities allowing data leakage

## Process

1. Test whether authenticated and unauthenticated users share cache entries
2. Check for Vary header correctness on user-specific content
3. Test for web cache deception (caching user-specific data on public paths)
4. Verify cache partitioning across different user roles and sessions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
