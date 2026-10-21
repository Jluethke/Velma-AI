# Dns Rebinding Execution

Execute the DNS rebinding attack in the controlled test environment and log all results.

## Inputs

- `rebinding-payloads`: Crafted rebinding payloads to execute
- `payload-target-map`: Mapping of payloads to targets

## Outputs

- `execution-results`: Results from each rebinding attempt
- `successful-rebinds`: List of successful rebinding attacks

## Process

1. Deploy payloads in the test environment
2. Monitor DNS resolution transitions from external to internal
3. Capture responses from internal services reached through rebinding

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
