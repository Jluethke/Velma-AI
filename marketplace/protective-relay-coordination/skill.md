# Protective Relay Coordination

Coordinate protective relays through the power system: overcurrent, distance, and directional elements, ensuring selectivity, sensitivity, and speed.

## Inputs

- `fault-current-results`: Fault currents at each bus for relay setting calculations
- `sequence-impedance-model`: Network impedances for distance relay reach calculations

## Outputs

- `relay-settings`: Pickup values, time dials, instantaneous settings, and coordination time intervals for each relay
- `coordination-study`: Time-current curves plotted for each protection zone showing coordination between primary and backup relays

## Process

1. Define the protection zones. Each zone has a primary relay (fast clearing) and at least one backup relay (clears if the primary fails, after a time delay). Zones overlap: the downstream relay's instantaneous zone should not reach into the upstream relay's zone. Work from the load toward the source when setting overcurrent relays.
2. Set the overcurrent relay pickup (50/51). The time-overcurrent (51) pickup must be above maximum load current with margin (typically 1.25-1.5x) and below minimum fault current in the protected zone. Select the time-current curve (inverse, very inverse, extremely inverse) based on the downstream device characteristics: extremely inverse curves coordinate well with fuse curves; inverse curves suit motor starting and transformer inrush.
3. Set the time dial for coordination. At the maximum fault current seen by both the upstream and downstream relays, the upstream relay must clear at least 0.3-0.4 seconds after the downstream relay (the coordination time interval, CTI). This accounts for relay operating time tolerance, circuit breaker clearing time, and relay overtravel. Work upstream from the most remote device, adding the CTI at each level.
4. Set instantaneous (50) elements. The instantaneous pickup is set above the maximum fault current that the downstream relay should clear (typically 125% of the maximum through-fault current for the next downstream bus). This provides fast clearing for faults close to the relay location without waiting for the time-overcurrent curve.
5. Verify coordination graphically. Plot all relay time-current curves, fuse curves, transformer damage curves, and cable damage curves on the same log-log axes. Verify: no overlap between adjacent relay curves at any fault current level (selectivity), all relays can detect the minimum fault current in their zone (sensitivity), and all faults are cleared within the equipment damage time (speed). Document the settings in a relay database for future maintenance and re-coordination.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
