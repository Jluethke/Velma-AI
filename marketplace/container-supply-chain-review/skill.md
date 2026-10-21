# Container Supply Chain Review

Review the container supply chain for image signing, registry access controls, and build pipeline integrity.

## Inputs

- `image-vulnerabilities`: Image scan results
- `secrets-findings`: Secrets management findings

## Outputs

- `supply-chain-findings`: Supply chain integrity issues
- `signing-status`: Image signing and verification status

## Process

1. Check whether images are signed and signatures are verified on pull.
2. Review registry access controls and who can push images.
3. Verify that the CI/CD pipeline builds from verified source only.
4. Check for use of image digests vs mutable tags in deployments.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
