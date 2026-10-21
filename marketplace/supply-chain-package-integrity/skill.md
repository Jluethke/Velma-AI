# Supply Chain Package Integrity

Verify package integrity through checksums, signatures, and provenance attestations.

## Inputs

- `dependency-tree`: Dependencies to verify
- `codebase-access`: Access to lock files and integrity records

## Outputs

- `integrity-findings`: Packages with missing or failing integrity verification
- `provenance-assessment`: Assessment of provenance attestation coverage

## Process

1. Check lock files for integrity hashes and verify them against registry
2. Test whether package manager verifies signatures on download
3. Check for Sigstore or other provenance attestations
4. Identify packages installed from source without integrity verification

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
