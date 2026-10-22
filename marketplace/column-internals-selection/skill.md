# Column Internals Selection

Select column internals (trays or packing) and size the column diameter.

## Inputs

- `design-stages`: Number of theoretical stages
- `separation-specification`: Flow rates, pressure, and property data for liquid and vapor
- `thermodynamic-model`: Property model for density, viscosity, surface tension calculations

## Outputs

- `internals-type`: Tray type or packing type selected with justification
- `column-diameter`: Column diameter from flooding analysis
- `actual-stages`: Actual stages after applying tray efficiency or HETP

## Process

1. Choose trays vs packing: trays are preferred for large diameters (above 1 m), high liquid rates, fouling service, and when intermediate draws are needed. Packing is preferred for small diameters, low pressure drop requirement, corrosive service, and vacuum operation.
2. For trays: select type. Sieve trays are cheapest but have narrow operating range. Valve trays give wider turndown (3:1 to 5:1). Bubble cap trays handle very low liquid rates but are expensive and high pressure drop.
3. Size the column diameter from flooding velocity. Calculate the Souders-Brown coefficient C_sb from the Fair correlation. V_flood = C_sb * sqrt((rho_L - rho_V)/rho_V). Set design velocity at 80% of flooding. Diameter = sqrt(4*V_dot / (pi * V_design)).
4. For trays, apply the O'Connell correlation for efficiency: E_o = 0.492 * (alpha * mu_L)^(-0.245). Actual stages = theoretical stages / E_o. Typical Murphree tray efficiencies range from 40% to 90%.
5. For packing, determine HETP from vendor data or the Onda correlation. HETP typically 0.3 to 0.8 m for structured packing, 0.5 to 1.5 m for random packing. Packed height = HETP * number of theoretical stages. Check operating range against minimum wetting rate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
