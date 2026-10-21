# Oscillatory Frequency Sweep

Measure storage and loss moduli as a function of frequency within the LVER to characterize the viscoelastic spectrum.

## Inputs

- `loaded-sample`: Material loaded and conditioned
- `frequency-sweep-parameters`: Strain amplitude (within LVER), frequency range
- `lver-limit`: Critical strain from the amplitude sweep to set the measurement strain below

## Outputs

- `frequency-sweep-data`: G', G'', complex viscosity, and tan(delta) vs frequency
- `viscoelastic-classification`: Material behavior type: liquid-like, gel-like, or solid-like with crossover frequency if present

## Process

1. Set the strain amplitude below the LVER limit
2. Run a logarithmic frequency sweep from high to low frequency
3. Plot G' and G'' vs frequency and identify crossover points, plateaus, and terminal zone behavior
4. Classify the material and check Cox-Merz rule agreement with steady-shear data

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
