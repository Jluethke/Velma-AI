# Simulation Property Method Selection

Select the thermodynamic property method and validate it against experimental data.

## Inputs

- `component-list`: All chemical species in the process
- `operating-conditions`: Temperature, pressure, and composition ranges

## Outputs

- `property-method`: Selected equation of state or activity coefficient model
- `binary-parameters`: Fitted or literature binary interaction parameters
- `validation-results`: Comparison of model predictions against experimental VLE/LLE data

## Process

1. Decision tree for property method: hydrocarbon system at moderate pressure: SRK or PR equation of state. Polar or non-ideal liquid: activity coefficient model (NRTL, UNIQUAC, Wilson). Electrolyte system: electrolyte-NRTL. Polymer system: PC-SAFT or polymer-NRTL. Supercritical: PR with volume translation.
2. Check the simulator's built-in binary parameter database. For NRTL and UNIQUAC, the DECHEMA or NIST/TDE databases are the primary sources. If parameters are missing, fit them to experimental VLE data using the simulator's regression tool.
3. Validate at conditions representative of the process: compare predicted bubble point, dew point, and x-y diagram against experimental data. For distillation, the error in relative volatility at the pinch composition is the most critical metric.
4. For gas-phase processes, verify the equation of state against PVT data and fugacity coefficient data. For high-pressure systems, check the liquid density prediction, which is often poor with cubic equations of state without volume translation.
5. Document the validation: which data were used, the source, and the residuals. Flag any region of the operating space where data are sparse and the model is extrapolating. These regions represent design risk.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
