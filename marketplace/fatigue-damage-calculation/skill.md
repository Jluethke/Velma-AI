# Fatigue Damage Calculation

Calculate cumulative fatigue damage and predict life under the service loading spectrum.

## Inputs

- `cycle-count`: Rainflow cycle count from the loading characterization
- `fatigue-curve`: S-N or strain-life curve for the component

## Outputs

- `fatigue-life-prediction`: Predicted life in cycles or hours, cumulative damage factor, and safety factor against the required life
- `critical-cycles-identification`: Which load cycles contribute most to damage, enabling targeted load reduction or design changes

## Process

1. Apply Palmgren-Miner linear damage accumulation: D = sum(n_i / N_f_i) for each cycle bin i, where n_i is the number of cycles at amplitude sigma_a_i and N_f_i is the number of cycles to failure at that amplitude from the S-N curve. Failure when D = 1.0 (or D = 0.5 to 2.0 in practice, reflecting the scatter in Miner's rule).
2. For cycles below the endurance limit: standard Miner's rule (original) ignores them (N_f = infinity). Modified Miner's rule (Haibach) extends the S-N curve below the endurance limit with a shallower slope (typically 2k-1 where k is the slope above the endurance limit). This accounts for small cycles that contribute to damage in the presence of larger overloads that open crack growth.
3. For non-proportional multiaxial loading: use a critical plane approach. Compute the shear strain amplitude and normal stress on the critical plane (the plane that maximizes damage). The Fatemi-Socie parameter combines shear strain with normal stress: gamma_max * (1 + k * sigma_n_max / sigma_y). Compare this to the uniaxial strain-life curve.
4. Compute the safety factor: SF = 1/D for infinite life. For finite life, SF = N_predicted / N_required. For stress-based safety factor, SF = sigma_endurance / sigma_a at the critical location. A safety factor of 2 on life corresponds to roughly 1.1 to 1.2 on stress (because the S-N curve is steep).
5. Identify which cycles dominate the damage: sort the damage contribution per bin (n_i / N_f_i) from largest to smallest. Often, the 10 largest amplitude cycles contribute 80% of the damage. Reducing these cycles (through load limiting, damping, or structural modification) is the most effective path to improved fatigue life.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
