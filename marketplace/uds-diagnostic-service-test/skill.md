# Uds Diagnostic Service Test

Test Unified Diagnostic Services for authentication bypass, unauthorized session access, and diagnostic abuse.

## Inputs

- `can-message-catalog`: Known CAN IDs including diagnostic addresses
- `vehicle-interface`: Interface for sending diagnostic requests

## Outputs

- `diagnostic-findings`: UDS authentication and access control weaknesses
- `ecu-session-map`: Map of ECUs responding to diagnostic sessions

## Process

1. Scan for ECUs responding to diagnostic session requests (service 0x10)
2. Test security access (service 0x27) seed-key algorithms for weakness
3. Attempt to read and write data identifiers (services 0x22 and 0x2E) without authentication
4. Test routine control (service 0x31) and input/output control (service 0x2F) access

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
