# Pilot Plant Design

Design the pilot plant to answer the specific scale-up questions identified in the dimensionless analysis.

## Inputs

- `scale-dependent-risks`: Scale-up risks and regime changes
- `controlling-regime`: Whether kinetics, heat, or mass transfer dominates
- `target-scale`: Production scale parameters

## Outputs

- `pilot-scale-specification`: Pilot plant size and configuration to resolve scale-up uncertainties
- `measurement-plan`: What to measure at pilot scale to validate the scale-up model
- `scale-up-criteria`: Specific criteria that must be met at pilot to proceed to production

## Process

1. Size the pilot to resolve the dominant scale-up risk, not to demonstrate the process at small scale. If heat transfer is the risk, the pilot must have the same heat transfer surface-to-volume ratio as production. If mixing is the risk, the pilot must operate at the same power per unit volume or tip speed.
2. For mixing scale-up: decide the basis. Constant tip speed (pi*N*D) preserves shear rate at the impeller but reduces bulk circulation. Constant power per volume (P/V proportional to N^3*D^5/V) is the most common basis for blending and gas-liquid dispersion. Constant Reynolds number preserves the flow regime but gives impractical impeller speeds at large scale.
3. Instrument the pilot to measure what the model predicts: temperature profiles (not just outlet), concentration profiles (not just conversion), pressure drop, mixing time (conductivity pulse response), and heat transfer coefficient (from energy balance). These measurements validate or falsify the scale-up model.
4. Define success criteria quantitatively before running the pilot: yield must exceed X%, temperature hot spot must stay below Y K, residence time distribution must match the PFR/CSTR model within Z%. This prevents post-hoc rationalization of marginal results.
5. Plan the number of runs: use statistical design of experiments (factorial or central composite) around the operating point. The pilot must demonstrate robustness to feed variability, not just performance at the design point.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
