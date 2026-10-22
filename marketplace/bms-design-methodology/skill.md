# Bms Design Methodology

Design the battery management system: cell monitoring, SOC estimation, balancing strategy, protection logic, and communication architecture.

## Inputs

- `pack-architecture`: Series/parallel count, module structure
- `electrical-design`: Voltage range, current limits, fusing and contactor layout

## Outputs

- `bms-specification`: BMS architecture with cell monitoring accuracy, SOC estimation method, balancing approach, protection thresholds, and communication protocols
- `protection-logic`: Overvoltage, undervoltage, overcurrent, overtemperature thresholds and response actions with timing

## Process

1. Define the BMS architecture. Distributed BMS places a cell monitoring IC on each module (measuring cell voltages and temperatures) communicating to a central controller via daisy-chain (isoSPI, CAN, or proprietary). Centralized BMS routes all cell connections to one board, limiting scalability but reducing cost for small packs.
2. Specify cell voltage measurement accuracy. For LFP, the flat voltage curve demands accuracy better than +/-3mV to distinguish SOC in the 20-80% range. For NMC, +/-5mV is adequate. Synchronous measurement across all cells is needed for accurate balancing decisions.
3. Implement SOC estimation. Coulomb counting (current integration) drifts over time. OCV lookup works only at rest. A Kalman filter or equivalent observer combines both: use the OCV-SOC curve as the measurement model and coulomb counting as the state transition model, with the internal resistance providing an additional observable. Recalibrate at full charge and full discharge rest periods.
4. Design the balancing strategy. Passive balancing (bleeding excess charge through resistors) is simple and cheap but wastes energy and generates heat. Active balancing (shuttling charge between cells via switched capacitors or transformers) preserves energy but adds cost and complexity. For grid-scale LFP, passive balancing at 50-200mA per cell is the standard approach. Run balancing during rest periods to avoid affecting SOC estimation.
5. Define protection thresholds and response timing. Overvoltage: disconnect charge path within 1 second if any cell exceeds Vmax (e.g., 3.65V for LFP). Undervoltage: disconnect discharge path if any cell drops below Vmin (e.g., 2.5V for LFP). Overcurrent: immediate disconnect for short circuit (hardware comparator, not software), timed disconnect for sustained overload. Overtemperature: reduce power above 45C cell temperature, disconnect above 55C.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
