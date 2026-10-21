# Auth Bypass Brute Force Test

Test brute force protections including account lockout, rate limiting, and CAPTCHA.

## Inputs

- `default-creds-results`: Default credentials results
- `target-application`: Target application URL

## Outputs

- `brute-force-results`: Brute force protection test results
- `lockout-thresholds`: Account lockout thresholds and bypass methods

## Process

1. Send incremental login attempts to test lockout thresholds
2. Test for rate limiting on login endpoints
3. Check for lockout bypass through IP rotation or header manipulation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
