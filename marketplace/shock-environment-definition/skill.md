# Shock Environment Definition

Define the shock and drop environment from applicable standards and field conditions, converting drop heights into acceleration pulses and shock response spectra.

## Inputs

- `product-category`: Product type (handheld, rack-mount, vehicle-mounted, portable equipment) and weight class
- `shipping-and-handling`: Packaging type, shipping method (parcel, freight, air), and expected handling conditions

## Outputs

- `shock-specification`: Shock pulse parameters (peak acceleration, pulse duration, pulse shape) for each applicable condition (operational shock, shipping drop, crash)
- `shock-response-spectrum`: SRS curves derived from the shock pulses, showing the maximum acceleration experienced by a single-degree-of-freedom oscillator at each natural frequency

## Process

1. Identify the applicable drop test standard. Consumer handheld (under 1kg): 1.0m drop to concrete per IEC 60068-2-31. Portable equipment (1-10kg): 0.75m drop. Rack equipment: 100mm free fall per Telcordia GR-63. Vehicle-mounted: MIL-STD-810 Method 516 with a 40g 11ms half-sine for operational shock.
2. Convert drop height to peak acceleration using the coefficient of restitution. For a rigid product dropped on concrete: a_peak = (1 + e) * v / delta_t where v = sqrt(2*g*h) is the impact velocity and delta_t is the pulse duration determined by product stiffness. A 1m drop gives v = 4.4 m/s. With a 2ms half-sine pulse, peak acceleration = (1 + 0.4) * 4.4 / 0.002 = 3080 m/s^2 = 314g.
3. Generate the shock response spectrum (SRS) from the shock pulse. The SRS plots the peak response of a series of single-degree-of-freedom oscillators (spanning the frequency range of interest) subjected to the shock pulse. At frequencies well below the pulse (f << 1/pulse_duration), the SRS approaches the peak acceleration. At high frequencies, it approaches the velocity change.
4. For shipping environments, combine drop shock with repetitive transportation vibration. The cumulative damage from thousands of small shocks during truck transport can exceed the damage from a single drop. Use PSD profiles from ISTA 3A or ASTM D4169 for the transportation vibration component.
5. Document the combined shock environment: number of drops per face/edge/corner, peak acceleration for each orientation, plus any operational shock events (door slam, emergency stop, seismic for rack equipment). Each condition becomes a test requirement.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
