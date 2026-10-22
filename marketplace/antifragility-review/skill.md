# Antifragility Review

Review the antifragility design quarterly. Track whether the system is actually getting stronger from the designed stressors.

## Inputs

- `stressor-schedule`: The designed stressors
- `redundancy-plan`: The redundancy buildout plan

## Outputs

- `antifragility-scorecard`: For each component: its current position on the fragility spectrum, the trend (improving, stable, degrading), and the evidence
- `updated-design-plan`: The revised antifragility plan: new stressors to add, redundancies to complete, options to acquire

## Process

1. For each component, re-assess its position on the fragility spectrum. Has it moved from fragile toward antifragile? Use evidence from the stressor schedule results.
2. Track the adaptation: after each designed stressor, did the system recover faster, perform better, or develop a new capability? If not, the stressor may be too weak or the wrong type.
3. Increase the stressor intensity gradually (progressive overload). If the system is adapting, it needs more challenge to continue improving.
4. Update the plan: add new stressors for components that have become resilient and need to push toward antifragile. Remove stressors for components that have reached a sufficient level.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
