# Rotation Workflow Designer

Design the rotation workflow for each secret type, ensuring zero-downtime during rotation.

## Inputs

- `secrets-catalog`: Inventory of secrets with type and location
- `infrastructure-inventory`: Services and their interconnections

## Outputs

- `rotation-workflows`: Step-by-step rotation workflow for each secret type
- `dependency-map`: Map of which services consume each secret and must be updated

## Process

1. For each secret type, design the rotation sequence: create new, update consumers, verify, retire old.
2. Map service dependencies to determine the update propagation order.
3. Design the dual-active period where both old and new secrets are valid simultaneously.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
