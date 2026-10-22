# Shock Isolation Design

Design shock isolation mounts when the shock loads exceed what the electronics can survive, selecting isolator type, stiffness, and damping to decouple the payload from the shock input.

## Inputs

- `critical-failure-modes`: Failure modes and their acceleration thresholds
- `design-changes-needed`: Design changes that are insufficient without isolation

## Outputs

- `isolator-specification`: Isolator type, stiffness, damping, load rating, and mounting configuration with predicted transmitted shock at the payload
- `isolation-trade-offs`: Displacement budget (isolated payload moves more), low-frequency amplification, and sway space requirements in the enclosure

## Process

1. Calculate the required isolation frequency. The isolator natural frequency must be well below the shock pulse frequency content for effective isolation. Rule of thumb: fn_isolator < 1/(5 * pulse_duration). For an 11ms half-sine pulse, fn < 18 Hz. Lower fn gives better isolation but more displacement.
2. Size the isolator stiffness from the natural frequency and payload mass: k = (2 * pi * fn)^2 * m. For a 2kg payload and 15 Hz natural frequency: k = (2*pi*15)^2 * 2 = 17,765 N/m = 17.8 kN/m. This is the total stiffness; divide among the number of mounts.
3. Select the isolator type. Wire rope isolators: excellent shock isolation, multi-axis, temperature-resistant, high damping (zeta = 0.15-0.35). Elastomeric mounts: compact, cheap, limited temperature range (-40 to +70C for natural rubber, -55 to +200C for silicone). Helical spring with viscous damper: precise control of stiffness and damping, larger.
4. Calculate the expected displacement under shock: x_max = v_impact / (2 * pi * fn * sqrt(1 - zeta^2)) for a velocity shock. With v = 4.4 m/s, fn = 15 Hz, zeta = 0.2: x_max = 4.4 / (94.2 * 0.98) = 47.6mm. The enclosure must provide this sway space in every direction of potential shock.
5. Verify with SRS analysis: overlay the isolator transmissibility curve on the shock SRS. The transmitted SRS at the payload should be below the fragility level of the electronics at all frequencies. Watch for high-frequency content that passes through the isolator (rubber mounts have a high-frequency resonance from internal mass-spring behavior). Add damping or a secondary isolation stage if needed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
