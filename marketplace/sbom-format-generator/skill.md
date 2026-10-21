# Sbom Format Generator

Generate the SBOM in a standard format (CycloneDX or SPDX) from the dependency inventory.

## Inputs

- `dependency-tree`: Complete dependency tree with direct and transitive dependencies
- `dependency-metadata`: Version, license, and source URL for each dependency

## Outputs

- `sbom-document`: SBOM in CycloneDX or SPDX format
- `sbom-validation-result`: Validation result confirming the SBOM conforms to the schema

## Process

1. Select the SBOM format based on organizational requirements (CycloneDX for security focus, SPDX for license focus).
2. Map dependency data to the chosen schema fields.
3. Validate the generated SBOM against the format specification.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
