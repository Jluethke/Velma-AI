# Motor Drive Protection

Design the protection circuits for the motor drive: overcurrent, overvoltage, overtemperature, desaturation detection, and safe shutdown sequencing.

## Inputs

- `power-stage-design`: Switch ratings, DC bus voltage range, maximum current, thermal limits
- `motor-selection`: Motor winding temperature limit, demagnetization current

## Outputs

- `protection-circuits`: Hardware overcurrent comparator threshold and response time, desaturation detection circuit, overvoltage clamp or brake chopper, temperature monitoring ADC channels and thresholds
- `fault-response-table`: For each fault type: detection method, response time, action (soft shutdown with deceleration ramp, hard shutdown with all switches off, or brake chopper activation)

## Process

1. Overcurrent protection must be fast enough to protect the switches before thermal damage. The MOSFET or IGBT safe operating area (SOA) defines the maximum current at the bus voltage; exceeding it causes device failure in microseconds. Use a hardware comparator on the current sense signal with a threshold at 150 percent of rated peak current. Response time from detection to gate turn-off must be under 5 to 10 microseconds.
2. Desaturation detection (for IGBTs): monitors Vce during conduction. Normal Vce_sat is 1.5 to 3V; during a short circuit, Vce rises to near bus voltage while current is limited by the IGBT's saturation characteristic. A comparator triggers when Vce exceeds a threshold (typically 7 to 9V) after a blanking time (2 to 5 us after turn-on to ignore the voltage spike during switching). The response is immediate gate turn-off with a controlled dV/dt gate pull-down to limit di/dt-induced voltage spikes.
3. Overvoltage protection: when the motor regenerates (decelerating) or when a fault causes load dump, the DC bus voltage rises. A brake chopper (a switch in series with a power resistor across the DC bus) activates when Vdc exceeds a threshold (typically 110 percent of nominal) and dissipates the regenerated energy. Alternatively, a TVS diode or varistor clamps transient spikes.
4. Overtemperature: monitor the switch case temperature (NTC thermistor on heatsink, or on-die temperature sense for intelligent power modules), motor winding temperature (PTC or NTC embedded in the winding), and ambient temperature. Derate current linearly as temperature approaches the limit. Shut down if any temperature exceeds the absolute maximum.
5. Safe shutdown sequence: on a non-critical fault (overtemperature warning), ramp the speed reference to zero over 100ms to 1s (controlled deceleration), then disable PWM. On a critical fault (overcurrent, desaturation, overvoltage), immediately turn off all switches (hard shutdown). For a motor with significant inertia, hard shutdown causes the back-EMF to appear on the inverter output; the freewheeling diodes conduct this current safely, but the bus capacitor must absorb the energy.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
