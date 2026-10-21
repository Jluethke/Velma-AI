# Microbial Metabolic Profiling

Profile the metabolic capabilities of the isolate using Biolog phenotype arrays or targeted substrate utilization panels.

## Inputs

- `pure-isolate`: Pure culture for metabolic characterization
- `growth-curves`: Growth parameters informing incubation time

## Outputs

- `metabolic-profile`: Substrate utilization matrix with positive, negative, and weak reactions
- `metabolic-cluster`: Comparison to reference profiles for phenotypic species confirmation

## Process

1. Inoculate Biolog GEN III or equivalent phenotype microarray per manufacturer protocol
2. Read kinetically or at endpoint and score each well as positive, borderline, or negative
3. Compare the utilization pattern against the database for species-level confirmation
4. Identify unusual metabolic capabilities that may explain niche adaptation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
