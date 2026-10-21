# Container Hardening Documenter

Produce the hardened image documentation covering all security decisions and verification steps.

## Inputs

- `signed-image-reference`: Signed image reference
- `scan-results`: Vulnerability scan results

## Outputs

- `hardening-documentation`: Complete documentation of the hardening process, decisions, and verification
- `hardened-image-package`: Final deliverable: signed image, Dockerfile, runtime config, and documentation

## Process

1. Document each hardening decision and its security rationale.
2. Include the scan results and any accepted risks with justification.
3. Package the Dockerfile, runtime config, signing instructions, and documentation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
