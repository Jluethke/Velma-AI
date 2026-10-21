# Container Image Signer

Sign the final image to establish provenance and integrity for deployment verification.

## Inputs

- `hardened-dockerfile`: Dockerfile used to build the image
- `runtime-config`: Container runtime configuration

## Outputs

- `signed-image-reference`: Signed image reference with digest and signature metadata
- `signing-verification-instructions`: Instructions for verifying the image signature before deployment

## Process

1. Build the final image with all hardening applied.
2. Sign the image using cosign or Notary with the organization's signing key.
3. Push the signed image to the approved registry and verify the signature.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
