# Cryostat Architecture Design

Select the cryostat type and design the cooling stages from room temperature to base temperature.

## Inputs

- `base-temperature-requirement`: Target base temperature (typically 10-20 mK for qubits)
- `cooling-power-requirement`: Heat load at each temperature stage from the experiment
- `experimental-volume`: Physical size and mass of the experiment at base temperature

## Outputs

- `cryostat-type-selection`: Dilution refrigerator, adiabatic demagnetization, or 3He system with justification
- `cooling-stage-layout`: Temperature stages, cooling power at each, and thermal intercept plan
- `cool-down-time-estimate`: Estimated time from room temperature to base temperature

## Process

1. Select the cryostat type by temperature and cooling power. Above 1K: 4He bath cryostat (pumped to 1.2K) or pulse tube cooler (to 3K, cryogen-free). For 0.3-1K: 3He refrigerator (single-shot or continuous cycle). Below 0.3K: dilution refrigerator is the standard for continuous cooling (base temperature 7-15 mK with modern dry systems). For temperatures below 50 mK with very low heat load: adiabatic demagnetization refrigerator (ADR), but single-shot cycle.
2. For a dilution refrigerator, design the temperature stages. A typical dry DR has: 50K stage (pulse tube first stage, 30-40W cooling), 4K stage (pulse tube second stage, 1-2W), still plate (~0.8K, 20-50 mW), cold plate (~0.1K, 0.5-1 mW), mixing chamber (10-20 mK, 10-20 uW at 20 mK). The cooling power at the mixing chamber scales as Q_dot = 84 * n_dot_3 * (T_mc^2 - T_still^2) where n_dot_3 is the 3He circulation rate.
3. Calculate the heat load budget at each stage. Sources: conduction through mechanical supports and wiring (integral of k(T)*A/L from hot to cold), radiation through shields (Stefan-Boltzmann with emissivity of gold-plated surfaces: ~0.02), dissipation in amplifiers or filters at the cold stages. The budget at each stage must be less than the available cooling power with margin (typically 50% margin).
4. Plan the thermal intercepts. Each wire from room temperature must be thermally anchored at each stage to prevent heat from reaching base temperature. Coaxial cables, DC wiring, and mechanical supports all need staged intercepts. Copper braid or copper-clad stainless connectors provide the thermal link. Calculate the heat load contribution from each cable type using tabulated thermal conductivity integrals.
5. Estimate the cool-down time. The dominant thermal mass is the mixing chamber plate and experiment hardware. Cool-down from 300K to 4K is limited by the pulse tube capacity (typically 12-24 hours). From 4K to base temperature, the dilution unit takes 4-12 hours. Total: 1-2 days for a typical quantum computing DR. Plan for pre-cooling with exchange gas if the experiment mass is large.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
