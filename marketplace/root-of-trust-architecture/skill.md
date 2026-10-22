# Root Of Trust Architecture

Define the hardware root of trust: immutable ROM bootloader, OTP fuse configuration for root public key hash, and the first-stage verification flow that anchors the entire boot chain.

## Inputs

- `platform-description`: SoC or MCU: boot ROM capabilities, OTP fuse map, secure storage available, debug interface
- `security-requirements`: Threat model, required boot chain depth, attestation requirements, update frequency

## Outputs

- `root-of-trust-design`: ROM boot flow, fuse programming plan, root key management strategy, first-stage loader specification
- `key-hierarchy`: Certificate chain: root CA, intermediate signing keys, code signing keys, rotation plan

## Process

1. Identify the immutable execution starting point: mask ROM in the SoC that executes on reset. This code must be minimal (verify hash/signature of next stage, branch to it or halt). Verify that no mechanism exists to bypass ROM execution (check boot pin strapping, JTAG override paths, test modes).
2. Program the root public key hash into OTP fuses. Store only the hash (SHA-256 of the root public key), not the key itself. The ROM reads the full root public key from a known flash location, hashes it, and compares to the fuse value. This allows key rotation: a new root key with a matching hash can be provisioned (or use a fuse-based key index for multi-key support).
3. Design the key hierarchy: Root CA (offline, HSM-stored, never exposed to network) signs an intermediate key. Intermediate key signs per-product-line code signing keys. Code signing keys sign firmware images. Separation allows revoking a compromised code signing key without re-fusing devices.
4. First-stage loader verification: ROM loads the first-stage image from flash, verifies its signature against the root public key (ECDSA P-256 or Ed25519 for speed, RSA-2048+ for compatibility with existing PKI). On verification failure: halt, do not fall back to unverified boot. First-stage then verifies second-stage, which verifies application. Each stage gates the next.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
