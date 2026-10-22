# Pv Energy Yield Model

Build a complete energy yield model quantifying every loss in the chain from incident irradiance to metered AC energy, following PVsyst methodology for bankability.

## Inputs

- `inverter-specification`: Inverter model and efficiency curve
- `dc-ac-ratio`: ILR and clipping loss estimate

## Outputs

- `annual-energy-yield`: P50 and P90 annual energy production in MWh with full loss tree breakdown
- `loss-chain-breakdown`: Each loss category quantified: soiling, shading, temperature, mismatch, wiring, inverter, transformer, clipping, availability, degradation

## Process

1. Start from POA irradiance. Apply the incidence angle modifier (IAM) loss: at off-normal angles, reflection from the glass surface reduces absorbed irradiance. Physical models use the Fresnel equations; empirical models use ASHRAE or Martin-Ruiz correlations. Typical annual IAM loss is 2-4%.
2. Apply spectral correction if using a model that accounts for it. Air mass and precipitable water vapor shift the solar spectrum relative to the STC reference (AM1.5). This matters more for CdTe (spectral gain at high air mass) than crystalline silicon.
3. Apply soiling loss. Site-specific soiling rates range from 1% per month in dusty arid climates to 0.1% per month in wet climates. Cleaning schedule reduces the average soiling loss. Model soiling as a sawtooth: linear accumulation between cleaning events.
4. Calculate cell temperature hourly from ambient temperature, wind speed, and irradiance. Apply the temperature derate: Pdc = Pstc x (1 + gamma x (Tcell - 25)), where gamma is the temperature coefficient of power (negative, typically -0.35 to -0.45%/C for crystalline silicon).
5. Apply remaining DC losses: module mismatch (1-2%), DC wiring (1-2%), module LID/LeTID (0.5-1.5% first year), and nameplate tolerance (use median from flash test data if available). Then apply inverter efficiency from the efficiency curve at each operating point, transformer loss (typically 0.5-1%), and AC wiring loss. Sum losses to get net AC energy. Express results as P50 (median year) and P90 (exceeded 90% of years, accounting for interannual irradiance variability, typically 5-7% sigma).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
