# Mtls Configurator

Implement mutual TLS between services for encrypted and authenticated communication.

## Inputs

- `control-plane-status`: Running control plane
- `communication-map`: Service communication patterns

## Outputs

- `mtls-config`: mTLS configuration and certificate management
- `mtls-verification`: Verification that all traffic is encrypted

## Process

1. Enable mTLS in permissive mode (allows plaintext during migration)
2. Verify all services can communicate through the mesh
3. Switch to strict mTLS mode once all services have sidecars
4. Verify encryption by inspecting traffic between services

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
