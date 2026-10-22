# Measured Boot Attestation

Implement measured boot with PCR-style measurement chain and remote attestation, plus debug port security to prevent bypass of the boot chain.

## Inputs

- `update-mechanism`: Firmware update protocol and image format
- `rollback-protection`: Anti-rollback counter and version enforcement

## Outputs

- `measured-boot-design`: Measurement chain: what is measured, PCR extend sequence, attestation quote format, verification procedure
- `debug-security-policy`: Debug port lock mechanism, authenticated debug access, lifecycle state machine

## Process

1. Measured boot: at each boot stage, before executing the next stage, hash its image and extend a PCR (Platform Configuration Register) in secure hardware (TPM or equivalent). PCR_new = Hash(PCR_old || measurement). This creates a chain where any change to any boot stage produces a different final PCR value. Measure: ROM version (from fuses), first-stage loader, second-stage, OS kernel, critical configuration.
2. Remote attestation: on request from a verifier, the device signs the current PCR values with a device-unique attestation key (stored in TPM or secure element). The verifier compares the signed PCR values against known-good reference values for that device model and firmware version. Mismatch indicates tampered boot chain.
3. Debug port security: JTAG and SWD must be disabled or locked by default in production. Implement a lifecycle state machine in OTP fuses: Development (debug open) -> Production (debug locked) -> RMA (debug re-enabled with authentication). Production lock must be irreversible (fuse-based). Authenticated debug: if needed for field diagnosis, require a challenge-response protocol where the debug tool proves possession of a per-device or per-model debug key before the debug port is unlocked for that session.
4. Verify the complete chain: attempt to boot with a modified image at each stage and confirm rejection. Attempt to roll back and confirm counter enforcement. Attempt debug access in production state and confirm lock. Perform attestation with a known-bad image and confirm the verifier detects it.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
