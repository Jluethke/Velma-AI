# Binary Protection Scan

Identify binary protections: ASLR, DEP/NX, stack canaries, PIE, RELRO, and CFI.

## Inputs

- `target-binary`: Path or reference to the authorized target binary
- `authorization-scope`: Written authorization for the assessment

## Outputs

- `protection-profile`: List of active and inactive protections
- `binary-metadata`: Architecture, compiler, linking details

## Process

1. Run checksec or equivalent to enumerate protections
2. Identify compiler and toolchain from binary metadata
3. Document which mitigations are present and which are absent

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
