# Toll Fraud Vector Test

Test for toll fraud vectors that could allow unauthorized long-distance or premium-rate calls.

## Inputs

- `sip-endpoint-inventory`: PBX and gateway systems to test
- `auth-weakness-findings`: Authentication weaknesses that could enable fraud

## Outputs

- `toll-fraud-findings`: Vectors that could enable unauthorized call routing
- `call-routing-analysis`: Analysis of outbound call routing rules and restrictions

## Process

1. Test for open SIP relays that forward calls without authentication
2. Check dial plan restrictions for premium-rate and international number blocking
3. Test for call forwarding abuse through voicemail or feature codes
4. Verify that trunk access codes require authentication

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
