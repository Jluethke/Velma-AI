# Chemical Transport Modeling

Configure and run a chemical transport model for the campaign domain to simulate pollutant formation, transport, and deposition.

## Inputs

- `source-attribution`: Emission source regions identified from trajectory analysis
- `boundary-layer-heights`: Observed BL heights for model evaluation

## Outputs

- `model-output`: Simulated concentration fields for target species over the campaign period
- `model-evaluation`: Bias, RMSE, and correlation of simulated vs. observed concentrations at the field site

## Process

1. Configure the model domain, resolution, meteorological driver, and emission inventory
2. Run the chemical transport simulation for the campaign period with hourly output
3. Extract model values at the field site location and compare against surface and profile observations
4. Diagnose model biases by time of day, wind direction, and chemical regime

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
