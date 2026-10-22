# Synthetic Schema Definer

Define the data schema, distributions, and constraints for synthetic generation.

## Inputs

- `real-data-sample`: Sample of the real data to replicate
- `generation-purpose`: Why synthetic data is needed (training, testing, privacy)

## Outputs

- `data-schema`: Schema with field types, ranges, and distributions
- `constraint-spec`: Constraints between fields and business rules

## Process

1. Profile the real data to extract schema and distributions.
2. Document the constraints between fields.
3. Identify sensitive fields that must not leak.
4. Define the target dataset size and format.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
