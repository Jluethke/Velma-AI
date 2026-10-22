# Hsm Architecture Design

Design a hardware security module: internal architecture, key hierarchy, key ceremony procedure, supported cryptographic services, and physical security boundary.

## Inputs

- `use-case-requirements`: Application: PKI CA, payment processing, code signing, database encryption, cloud KMS
- `performance-targets`: Operations per second by type (RSA sign, AES encrypt, ECDSA verify), concurrent sessions

## Outputs

- `hsm-architecture`: Internal block diagram: crypto accelerators, key storage, tamper mesh, processor, interfaces
- `key-ceremony-procedure`: Multi-party key generation procedure, custodian roles, split knowledge, audit trail

## Process

1. Internal architecture: dedicated crypto processor (or FPGA with crypto IP), hardware accelerators for AES, SHA, RSA, ECC, battery-backed SRAM for key storage, tamper mesh and environmental sensors around the security boundary, external interfaces (PCIe, Ethernet, USB). Separate the management interface from the data interface.
2. Key hierarchy: Master key (generated inside HSM, never exported, protects all other keys). Key-encrypting keys (KEK: wrap/unwrap data keys for storage outside HSM). Data keys (used for actual cryptographic operations). Token keys (bound to authenticated sessions). Each key has attributes: extractable (yes/no), usage (sign, encrypt, wrap), algorithm.
3. Key ceremony for master key initialization: requires M-of-N custodians (e.g., 3-of-5). Each custodian holds a smart card with a key share. During ceremony: each custodian authenticates and inserts their share. HSM reconstructs the master key from the shares (Shamir's secret sharing). Ceremony must be witnessed, recorded (video), and logged in the HSM audit trail. No single person ever sees the complete master key.
4. Audit: every key operation logged with timestamp, operation type, key ID, requesting identity, success/failure. Logs are signed by the HSM to prevent tampering. Log export for compliance (PCI DSS, eIDAS, FIPS). Dual control: critical operations (master key generation, firmware update) require two authenticated administrators.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
