# Pv Module And String Sizing

Select PV modules based on technology trade-offs and size strings to match inverter MPPT voltage windows across the full operating temperature range.

## Inputs

- `poa-irradiance-profile`: Monthly and annual POA irradiance with shading factors
- `site-thermal-profile`: Temperature distribution for voltage calculations

## Outputs

- `module-selection`: Selected module with datasheet parameters: Pmax, Voc, Vmp, Isc, Imp, temperature coefficients, degradation rate, and bifacial gain if applicable
- `string-configuration`: Number of modules per string and strings per inverter MPPT, with voltage range verification at temperature extremes

## Process

1. Compare module technologies. Mono PERC is the baseline. TOPCon offers 0.5-1% higher efficiency with better temperature coefficient. HJT has the best temperature coefficient (about -0.26%/C vs -0.35%/C for PERC) but higher cost. Bifacial adds 5-15% energy gain depending on albedo and mounting height.
2. Calculate string length from inverter MPPT voltage window. At the coldest expected temperature (record low or ASHRAE 99.6% design temperature), Voc must not exceed the inverter maximum input voltage. Use: Voc_cold = Voc_STC x (1 + TempCoeff_Voc x (Tmin - 25)).
3. At the hottest expected temperature (ASHRAE 0.4% design temperature), Vmp must stay above the inverter MPPT minimum voltage. Use: Vmp_hot = Vmp_STC x (1 + TempCoeff_Vmp x (Tmax_cell - 25)), where Tmax_cell includes irradiance heating above ambient.
4. The maximum string length is floor(Vmax_inverter / Voc_cold). The minimum string length is ceil(Vmppt_min / Vmp_hot). If min exceeds max, the module-inverter pairing does not work at this site.
5. Select the string length that keeps the operating voltage near the middle of the MPPT window for the majority of operating hours. Longer strings reduce BOS cost (fewer strings, combiner boxes, home runs) but reduce design flexibility.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
