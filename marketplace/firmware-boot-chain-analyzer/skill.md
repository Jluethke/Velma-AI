# Firmware Boot Chain Analyzer

Analyze the boot chain for secure boot configuration, signature verification, and trusted execution.

## Inputs

- `extracted-filesystem`: Extracted firmware filesystem
- `device-model`: Device model for boot chain documentation lookup

## Outputs

- `boot-chain-findings`: Secure boot gaps and bypass possibilities
- `trust-chain-map`: Map of the boot trust chain from ROM to application

## Process

1. Trace the boot sequence from bootloader through kernel to application
2. Check whether each stage verifies the signature of the next
3. Test for bootloader unlock, JTAG/SWD debug access, and UART console
4. Assess whether the trust chain can be broken at any stage

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
