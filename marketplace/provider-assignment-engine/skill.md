# Provider Assignment Engine

Assign the patient to a provider based on availability and clinical need.

## Inputs

- `chief-complaint`: Reason for the visit
- `eligibility-status`: Insurance eligibility confirmation

## Outputs

- `assigned-provider`: Name and specialty of the assigned provider
- `intake-record`: Complete intake record ready for the provider

## Process

1. Match the chief complaint to provider specialty.
2. Check provider availability.
3. Assign and notify the provider with the intake summary.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
