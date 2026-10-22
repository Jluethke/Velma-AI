# Failure Triage And Electrical Characterization

Reproduce the reported failure, characterize the electrical symptoms, and narrow the fault to a specific circuit or component through systematic measurement before any physical inspection.

## Inputs

- `failure-report`: Description of the failure: symptoms, conditions, intermittent vs permanent, field or manufacturing origin
- `board-documentation`: Schematic, layout, BOM, and any available production test data for the failed unit

## Outputs

- `failure-reproduction`: Confirmed failure mode with the conditions required to reproduce it (temperature, load, timing, sequence)
- `electrical-characterization`: Measured electrical parameters that deviate from specification, with comparison to a known-good reference unit
- `fault-localization`: Suspected component or circuit area based on electrical measurements, narrowed to the minimum ambiguity group

## Process

1. Review the failure report for context: field return (usage conditions, age, environment) or manufacturing fallout (which test step caught it, what the test data shows). If production test data is available, analyze the parametric trend for this unit compared to the population (was it marginal at test or a sudden failure?).
2. Attempt to reproduce the failure under controlled conditions. If the failure is intermittent, systematically vary temperature (hot and cold), voltage (high and low line), mechanical stress (board flex, connector reseat), and timing (power sequencing, data rate) to find the conditions that trigger it. Document the exact conditions for reproducibility.
3. Compare the failed unit to a known-good reference unit. Measure power supply voltages, clock frequencies, signal amplitudes, and communication waveforms on both units under identical conditions. The difference between good and failed unit measurements points to the fault area.
4. Use divide-and-conquer to narrow the fault. For a signal chain failure, probe the signal at intermediate points between input and output. The last point where the signal is good and the first point where it is bad brackets the faulty component. For power supply failures, measure upstream to downstream until the fault is located.
5. For intermittent failures that cannot be reproduced on the bench, apply environmental stress (thermal chamber, vibration) while monitoring the symptomatic signal on an oscilloscope with a persistence or envelope capture mode. The intermittent event will eventually appear and the environmental condition at the moment of failure provides a clue to the mechanism.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
