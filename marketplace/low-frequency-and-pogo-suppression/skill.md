# Low Frequency And Pogo Suppression

Analyze and suppress low-frequency instabilities (chugging) and vehicle-level pogo oscillation.

## Inputs

- `pressure-drop-ratio`: Injector pressure drop as fraction of chamber pressure
- `stage-mass-estimates`: Vehicle structural and propellant mass for pogo analysis
- `turbopump-requirements-derivation`: Feed system characteristics

## Outputs

- `chugging-stability-assessment`: Low-frequency stability margin from feed system/combustion coupling
- `pogo-mode-identification`: Vehicle longitudinal structural modes that can couple with propulsion
- `pogo-suppression-design`: Accumulator or other device specification for pogo suppression

## Process

1. Chugging (10-400 Hz): interaction between feed system dynamics and combustion. Low injector pressure drop allows chamber pressure fluctuations to modulate propellant flow. The stability criterion: injector pressure drop must exceed a critical fraction of chamber pressure (typically >15-20%). Pressure-fed engines are more susceptible than pump-fed.
2. Feed system resonance: the propellant feed lines, valves, and manifolds form an acoustic system. If a feed line acoustic mode coincides with a chamber acoustic mode, coupled instability can occur. Feed line length and compliance set the resonant frequencies.
3. Pogo oscillation: the vehicle longitudinal structural mode couples with the propulsion system through a feedback loop: structural vibration changes propellant head at the pump inlet, which changes thrust, which drives structural vibration. This destroyed Gemini-Titan and nearly destroyed Apollo 6.
4. Pogo suppression: install a gas-filled accumulator in the feed line to change the feed system compliance and detune it from the structural mode. The accumulator acts as a low-pass filter, absorbing pressure oscillations faster than the structural frequency. The Saturn V used helium-charged accumulators in the LOX feed lines.
5. Analysis method: model the vehicle structure (longitudinal modes), propulsion system (feed system impedance), and coupling (thrust-to-acceleration loop). The system is stable if the Nyquist plot of the open-loop transfer function does not encircle -1. The accumulator volume and gas charge are sized to move the open-loop gain below 1 at all structural frequencies.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
