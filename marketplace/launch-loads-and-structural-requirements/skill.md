# Launch Loads And Structural Requirements

Define the structural load cases from the launch vehicle environment, establish natural frequency requirements, and derive the structural design loads.

## Inputs

- `launch-vehicle-environment`: Quasi-static load factors, random vibration PSD, acoustic environment, shock environment from launch vehicle user guide
- `spacecraft-mass-properties`: Total mass, center of gravity, moments of inertia, component masses and locations

## Outputs

- `design-load-cases`: Combined load cases (static + dynamic) with factors of safety applied
- `frequency-requirements`: Minimum natural frequency constraints from launch vehicle coupled loads analysis

## Process

1. Extract quasi-static load factors from the launch vehicle user guide. Typical values: axial 3-6g, lateral 1-3g. These occur at different flight events (max-Q, engine cutoff, stage separation). The design must withstand the most severe combination, which is not always the highest individual axis load.
2. Determine the natural frequency requirements. Launch vehicles specify minimum fundamental frequency to avoid dynamic coupling: typically >15 Hz lateral, >25 Hz axial for most vehicles. If the spacecraft frequency is too low, coupled loads analysis is required to determine the actual dynamic response.
3. Calculate the random vibration response using Miles equation for single-degree-of-freedom response to a flat PSD input: a_rms = sqrt(pi/2 * f_n * Q * W), where f_n is the natural frequency, Q is the amplification factor (typically 10-25 for spacecraft structures), and W is the PSD level at f_n in g^2/Hz. The 3-sigma acceleration is 3 * a_rms.
4. Define the factor of safety approach. For metallic structures: 1.25 on ultimate (yield) and 1.40 on ultimate (failure) per NASA-STD-5001. For composite structures: 1.50 on ultimate. For pressurized structures: 2.0 on proof, 2.5 on burst for safety-critical. Prototype hardware tested to qualification levels uses 1.25/1.40; protoflight uses qualification levels with acceptance duration but flight hardware factors.
5. Combine the load cases. The design loads are the quasi-static loads factored by the KM factor (mass acceleration curve from the coupled loads analysis, or a conservative estimate from the launch vehicle user guide). Add random vibration and acoustic contributions as RSS with the static loads if they are uncorrelated.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
