# Consent Enforcement Test

Test that non-essential cookies are blocked until the user gives consent.

## Inputs

- `classified-cookies`: Cookies classified by category
- `website-url`: The website URL

## Outputs

- `enforcement-results`: Results of testing consent enforcement (pass/fail for each cookie category)
- `violations`: List of cookies that fire before consent is given

## Process

1. Load the website without interacting with the consent banner and record which cookies are set.
2. Verify that only strictly necessary cookies are present before consent.
3. Accept each category individually and verify that only the corresponding cookies are activated.
4. Reject all optional categories and verify that no non-essential cookies are set.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
