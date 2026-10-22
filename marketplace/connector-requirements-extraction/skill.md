# Connector Requirements Extraction

Extract the complete connector requirements from the system design, catching the requirements that are typically discovered too late in development.

## Inputs

- `interface-definition`: Signals that must cross the connector: count, type (power, analog, digital, RF), voltage and current levels
- `application-environment`: Operating environment, mating cycles, cable type, and connector accessibility during assembly and service

## Outputs

- `connector-requirements`: Complete requirements: pin count, current per contact, voltage rating, impedance (if controlled), environmental rating, mating cycles, retention force, keying, and mounting method
- `interface-constraints`: Constraints from the PCB (available board area, component height limit), cable (wire gauge range, bend radius), and assembly process (blind mate, hand mate, automated)

## Process

1. Count the signals and group by type. Separate power (high current), ground (low inductance), analog (shielded, low noise), digital (controlled impedance if over 100 MHz), and RF (coaxial). Each type has different contact requirements.
2. Determine current requirements per contact. Derate the manufacturer's current rating for your actual temperature rise limit and contact count. A contact rated 3A in free air may only handle 1.5A when all positions in a multi-pin connector are loaded, because adjacent contacts share the thermal path. Apply a 50% derating for fully loaded connectors.
3. Set the voltage rating. Working voltage must be below the connector's rated voltage at the operating altitude. Voltage rating decreases with altitude due to reduced air density. At 3000m altitude, derate by approximately 30% for voltages above 200V. For DC applications, also check the dielectric withstand voltage (typically 2x rated + 1000V for 1 minute).
4. Define the impedance requirement for high-speed signals. If the signal bandwidth exceeds 100 MHz, use impedance-controlled contacts. Standard controlled-impedance connectors: 50 ohm single-ended, 100 ohm differential. The connector's impedance mismatch budget is typically +/-10% of the system impedance for return loss below -20 dB.
5. Specify mating cycles, insertion/extraction force, and keying. Industrial connectors: 500-1000 cycles minimum. Consumer: 5000-10,000 (USB standard requires 10,000). Keying (polarization) prevents mis-mating. Specify unique keying between connectors with different pinouts on the same product to prevent cross-plugging.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
