# Protection Coordination Design

Design the protection system for the interconnection: relay selection, coordination with utility relays, and anti-islanding detection.

## Inputs

- `power-flow-results`: Normal and contingency operating conditions at the POI
- `short-circuit-analysis`: Fault current levels for relay setting calculations

## Outputs

- `protection-scheme`: Relay types, settings, and coordination study showing time-current curves and operating sequences
- `anti-islanding-design`: Islanding detection method, detection time, and trip logic

## Process

1. Define the protection zones. At minimum: generator zone (between the inverter and the step-up transformer), interconnection zone (between the step-up transformer and the POI), and the utility line zone (utility-owned relays on their side of the POI). Each zone requires primary and backup protection.
2. Select relays for the generator zone. Overcurrent (50/51), overvoltage and undervoltage (27/59), overfrequency and underfrequency (81O/81U), and reverse power (32) are the minimum set. For inverter-based resources, negative sequence overcurrent (46) detects unbalanced faults. Set the overcurrent elements above maximum normal current with margin for measurement error and below the minimum fault current.
3. Coordinate with utility relays. The project's relays must trip faster than the utility's recloser on the feeder or the utility's zone 2 distance relay on the transmission line. Plot time-current curves for all relays in series and verify a minimum coordination interval (typically 0.3 seconds) between adjacent relay operating times at the maximum fault current.
4. Design anti-islanding protection per IEEE 1547-2018. Passive methods (voltage and frequency trip settings) detect most islanding conditions. For conditions where load and generation are closely matched, active methods (frequency shift, impedance measurement, or transfer trip from the utility breaker) are needed. Transfer trip via direct communication from the utility breaker to the project provides the most reliable detection.
5. Develop the trip logic. Define the sequence: fault detection, breaker trip, lockout, and reclosure blocking. For utility-side faults, the project must cease energization within 2 seconds (IEEE 1547 requirement). For project-side faults, coordinate with the utility to ensure the utility does not trip for faults that the project's relays will clear. Document all settings in a relay settings database for future coordination studies.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
