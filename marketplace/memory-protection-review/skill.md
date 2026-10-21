# Memory Protection Review

Review memory protection configuration: MPU regions, flash read protection, and secure enclaves.

## Inputs

- `device-under-test`: Physical device
- `bootloader-findings`: Bootloader findings for context

## Outputs

- `memory-protection-findings`: Memory protection misconfigurations found
- `data-at-rest-exposure`: Sensitive data accessible through memory read

## Process

1. Check MPU or MMU configuration for proper region isolation
2. Test flash read protection level and whether it can be bypassed through debug interfaces
3. Check for secure enclave or TrustZone configuration and its effectiveness
4. Attempt to read sensitive memory regions (keys, credentials) through available interfaces

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
