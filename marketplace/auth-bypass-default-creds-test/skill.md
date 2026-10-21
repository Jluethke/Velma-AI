# Auth Bypass Default Creds Test

Test for default and commonly used credentials on all authentication endpoints.

## Inputs

- `target-application`: Target application URL and login endpoints
- `engagement-scope`: Authorized scope and rules of engagement

## Outputs

- `default-creds-results`: Results of default credential tests
- `weak-accounts`: Accounts found with default or weak credentials

## Process

1. Test common default credentials (admin/admin, root/root, test/test)
2. Check for vendor-specific default credentials
3. Test for blank passwords and username-as-password patterns

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
