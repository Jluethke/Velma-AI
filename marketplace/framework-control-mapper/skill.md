# Framework Control Mapper

Map existing security controls to the target framework requirements.

## Inputs

- `target-framework`: The compliance framework to assess against (NIST CSF, SOC2, ISO 27001)
- `existing-controls-inventory`: Inventory of current security controls, policies, and procedures

## Outputs

- `control-mapping`: Mapping of existing controls to framework requirements
- `coverage-summary`: Percentage of framework requirements covered by existing controls

## Process

1. Decompose the target framework into individual control requirements
2. For each requirement, identify existing controls that address it (full, partial, or none)
3. Document the evidence supporting each control mapping
4. Compute coverage percentages by domain and overall

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
