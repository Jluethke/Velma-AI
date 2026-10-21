# Cicd Artifact Integrity Check

Test artifact integrity controls including signing, checksums, and provenance verification.

## Inputs

- `pipeline-inventory`: Catalog of pipelines and artifact outputs
- `confusion-findings`: Dependency confusion findings

## Outputs

- `integrity-findings`: Assessment of artifact signing, checksums, and provenance
- `tamper-resistance-score`: Rating of how resistant the pipeline is to artifact tampering

## Process

1. Check whether build artifacts are signed and whether signatures are verified at deployment
2. Test if checksums are computed and validated for all transferred artifacts
3. Review provenance metadata (SLSA level, build attestations)
4. Test whether a modified artifact can pass through the pipeline undetected

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
