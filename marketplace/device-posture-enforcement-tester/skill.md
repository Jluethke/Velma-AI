# Device Posture Enforcement Tester

Test whether device posture is enforced as a condition of access.

## Inputs

- `access-flow-map`: All access flows with identity checks
- `identity-provider-config`: IdP and MDM configuration

## Outputs

- `posture-enforcement-results`: Which access flows check device posture and which do not
- `posture-bypass-paths`: Ways to access resources from non-compliant devices

## Process

1. Test access from a compliant enrolled device and confirm success
2. Test access from a non-compliant device (missing patches, no encryption, no MDM) and confirm denial
3. Test access from an unmanaged personal device
4. Identify access paths that skip device posture checks entirely

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
