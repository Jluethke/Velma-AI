# Auth Bypass Session Fixation Test

Test for session fixation by checking whether session IDs rotate after authentication.

## Inputs

- `logic-flaw-results`: Logic flaw results
- `target-application`: Target application

## Outputs

- `session-fixation-results`: Session fixation test results
- `session-management-findings`: Session management weaknesses found

## Process

1. Check whether session IDs change after successful login
2. Test for session fixation through URL, cookie, or hidden field injection
3. Verify session invalidation on logout

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
