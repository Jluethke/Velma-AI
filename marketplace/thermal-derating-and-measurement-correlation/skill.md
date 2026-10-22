# Thermal Derating And Measurement Correlation

Apply component derating rules, verify the thermal design through measurement on prototype boards, and correlate simulation with measurement.

## Inputs

- `natural-convection-result`: Calculated thermal performance
- `forced-convection-result`: Calculated thermal performance with airflow
- `max-junction-temperature`: Component maximum ratings
- `component-power-dissipation`: Power dissipation values to verify

## Outputs

- `derating-analysis`: Each component's operating temperature vs its derated maximum, with margin percentage
- `thermal-measurement-results`: Thermocouple or IR camera measurements on the prototype, at each critical component
- `simulation-correlation`: Comparison of predicted vs measured temperatures with correction factors for future designs

## Process

1. Apply derating: most reliability standards (IPC-9592, JEDEC, or company-specific) require operating 10 to 25C below the absolute maximum junction temperature. For example, if T_j_max = 125C and the derating policy is 80% of the absolute range above 25C, the derated limit is 25 + 0.8*(125-25) = 105C. Verify every component operates below its derated limit.
2. Measure on prototype: attach Type-K thermocouples to the top of critical components using thermal epoxy (not tape, which adds insulation). Measure at worst-case operating conditions (maximum load, maximum ambient, minimum airflow). For exposed-pad packages, also measure the PCB backside temperature under the component.
3. For components where thermocouple access is difficult (BGA underside), use an IR camera with the surface coated in high-emissivity paint (emissivity > 0.95). Bare copper and solder have low emissivity (0.05 to 0.2) and will read inaccurately without the coating.
4. Correlate: compare measured temperatures to the thermal model predictions. If measured is more than 5C higher than predicted, investigate: thermal via connections may have insufficient plating, TIM may have voids or excess thickness, airflow may be lower than assumed due to system-level obstructions. Record correction factors and apply to the thermal model for production verification.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
