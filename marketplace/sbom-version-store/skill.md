# Sbom Version Store

Store and version SBOMs so that any release can be traced back to its exact dependency set.

## Inputs

- `enriched-sbom`: SBOM with vulnerability and license annotations
- `pipeline-config`: CI/CD pipeline configuration for SBOM generation

## Outputs

- `sbom-archive`: Versioned SBOM archive linked to build and release identifiers
- `archive-access-policy`: Access control policy for the SBOM archive

## Process

1. Tag each SBOM with the build ID, commit hash, and release version.
2. Store in the artifact repository alongside build outputs.
3. Set access controls so that authorized users and audit tools can retrieve any version.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
