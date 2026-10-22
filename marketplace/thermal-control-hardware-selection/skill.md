# Thermal Control Hardware Selection

Select and size thermal control hardware: surface coatings, multi-layer insulation, heaters, heat pipes, and radiators to maintain all components within their allowable temperature range.

## Inputs

- `thermal-environment`: Heat fluxes for hot and cold cases
- `energy-balance-model`: Nodal model with boundary conditions

## Outputs

- `thermal-hardware-design`: Surface finish map, MLI coverage, heater sizes and locations, heat pipe specifications, radiator area
- `temperature-predictions`: Predicted temperature ranges for all components in hot and cold cases with margin

## Process

1. Select surface coatings by function. For radiator surfaces that must reject heat: low alpha/epsilon ratio (white paint, OSR, second-surface mirrors: alpha_s = 0.05-0.15, epsilon_IR = 0.80-0.90). For surfaces that must absorb solar energy: high alpha/epsilon (black anodize: alpha = 0.88, epsilon = 0.88). Account for coating degradation: alpha_s increases with UV and particle exposure. Use EOL alpha values for hot case analysis.
2. Size MLI blankets. Effective emissivity of MLI is typically 0.01-0.03 for 15-25 layer blankets with proper construction (no compression, sealed edges, adequate venting). The heat leak through MLI: q = epsilon_eff * sigma * (T_hot^4 - T_cold^4). MLI is used on all surfaces that are neither radiators nor solar-absorbing.
3. Size heaters for the cold case. The heater power must make up the deficit when internal dissipation is minimum and heat loss is maximum. Q_heater = Q_radiation_out + Q_conduction_out - Q_minimum_internal - Q_environmental_minimum. Add 25% margin. Select heater type: Kapton film heaters for flat surfaces, cartridge heaters for propellant lines.
4. Design heat transport. Heat pipes transport heat from dissipating components to radiators without power. Constant-conductance heat pipes: wick structure (sintered, groove, screen mesh) determines capillary pressure, which must exceed the sum of gravitational, viscous, and entrainment pressure losses. Variable-conductance heat pipes (VCHP) with gas reservoir control the radiator effective area.
5. Size the radiator. A_rad = Q_reject / (epsilon * sigma * (T_rad^4 - T_environment^4)). T_environment is the effective sink temperature including Earth IR and albedo contributions. For a space-facing radiator, the sink temperature is approximately 3K plus Earth IR contributions from the view factor. Verify the radiator area fits within the available spacecraft surface area.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
