# Anti Rollback And Update

Design the anti-rollback mechanism and secure firmware update flow: monotonic counters, version enforcement, authenticated encrypted update images, and recovery mode with minimal attack surface.

## Inputs

- `root-of-trust-design`: ROM boot flow and fuse layout
- `key-hierarchy`: Certificate chain and code signing keys

## Outputs

- `update-mechanism`: Firmware update protocol: image format, authentication, encryption, anti-rollback, recovery
- `rollback-protection`: Monotonic counter scheme, version enforcement policy, fuse utilization plan

## Process

1. Anti-rollback: embed a minimum-version field in each signed firmware image. Store the current minimum-version in a monotonic counter (OTP fuse bits or secure counter in trusted storage). On boot, reject any image with version below the stored counter. On successful update, advance the counter to the new version. Fuse-based counters are limited (e.g., 64 fuse bits = 64 version increments); plan fuse utilization across product lifetime.
2. Firmware update image format: header (version, target hardware ID, image size, signature algorithm) + encrypted firmware payload (AES-256-GCM: authenticated encryption provides confidentiality and integrity) + signature over header and encrypted payload (code signing key). The device decrypts only after signature verification passes.
3. Update flow: receive image over authenticated channel (TLS to update server, or local USB with host authentication). Verify signature. Check version against anti-rollback counter. Write to inactive partition (A/B scheme: boot from A, update writes to B; on next boot, try B; on failure, fall back to A). Verify written image integrity (re-read and re-hash). Mark new partition as active. Advance anti-rollback counter only after successful boot of new image.
4. Recovery mode: minimal code path that accepts a signed recovery image. Recovery mode must still enforce signature verification (no unsigned recovery). Trigger: hardware button held during reset, or corruption detected in both A/B partitions. Recovery mode should not expose debug interfaces or bypass boot chain.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
