# Renewable Option Evaluator

Evaluate the procurement options for renewable energy.

## Inputs

- `renewable-requirement`: Required renewable MWh and timeline
- `site-assessment`: Onsite generation potential

## Outputs

- `option-comparison`: Comparison of options (onsite solar, offsite PPA, virtual PPA, RECs, community solar) with pros, cons, and financials
- `recommended-approach`: Recommended procurement approach with rationale

## Process

1. Model onsite generation: installed cost, net metering value, maintenance, and payback.
2. Model offsite PPA or virtual PPA: contract price, term length, and basis risk.
3. Model unbundled RECs: current market price, vintage, and additionality.
4. Compare all options on cost, additionality, risk, and alignment with goals.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
