# Physics Model Selection

Select the appropriate physics model fidelity for the digital twin based on the use case, available data, and computational constraints.

## Inputs

- `twin-use-cases`: What the digital twin must answer: condition monitoring, predictive maintenance, design optimization, scenario analysis
- `available-sensor-data`: Sensors installed, their measurement types, sample rates, and data quality

## Outputs

- `model-selection-rationale`: Selected model type with justification against alternatives
- `model-specification`: Model inputs, outputs, state variables, parameters, assumptions, and validity envelope

## Process

1. Match model fidelity to use case: condition monitoring needs a simple threshold or regression model, predictive maintenance needs a physics-of-degradation model (crack growth, wear, corrosion), design optimization needs a high-fidelity FEA/CFD model or surrogate, scenario analysis needs a real-time capable model.
2. Assess available data against model needs. A physics model requires boundary conditions (loads, temperatures, pressures) that sensors must provide. If key boundary conditions are not measured, either add sensors, estimate from related measurements, or reduce model fidelity to match available data.
3. Consider computational constraints: high-fidelity FEA/CFD may take hours per simulation, making it unsuitable for real-time operation. Options: reduced-order model (POD, DMD), surrogate model (Gaussian process, neural network trained on full model), or physics-informed neural network (PINN).
4. Document the model validity envelope: the range of operating conditions where the model's predictions are trustworthy. Outside this envelope, the twin should flag low confidence rather than extrapolate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
