# Continuous Auth Tester

Test continuous authentication and authorization during active sessions.

## Inputs

- `access-flow-map`: All access flows
- `identity-provider-config`: IdP session and token configuration

## Outputs

- `continuous-auth-findings`: Sessions that persist after posture or risk changes
- `session-lifetime-analysis`: Session durations and re-authentication frequency

## Process

1. Establish a session, then change the device posture to non-compliant and check if access is revoked
2. Test whether disabling the user account terminates active sessions
3. Check session token lifetimes and whether step-up authentication triggers on sensitive actions
4. Test whether risk-based policies adjust access during an active session

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
