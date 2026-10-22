# Cable Shield Grounding And Io Design

Design cable shield terminations and I/O connector filtering for minimum common-mode emission, including the pigtail vs 360-degree grounding decision.

## Inputs

- `cable-interfaces`: All cables with type and shielding
- `common-mode-choke-specs`: Choke specs if applicable
- `radiation-mode-assessment`: Common-mode emission assessment for cable interfaces

## Outputs

- `shield-termination-design`: For each shielded cable: termination method (360-degree, pigtail, both ends, one end), with the engineering rationale
- `connector-filter-layout`: I/O connector area layout with filter capacitors, ferrite beads, and ESD protection placement
- `chassis-bonding-spec`: Chassis ground bonding specification: bond impedance target, surface preparation, fastener spacing

## Process

1. Default to 360-degree shield termination (shield soldered or clamped around the full circumference of the connector). A pigtail (wire from shield braid to a ground point) has inductance of approximately 1 nH/mm. A 25 mm pigtail has 25 nH of inductance, which is an impedance of 15 ohms at 100 MHz. This defeats the shield above a few tens of MHz. Only use a pigtail when 360-degree termination is physically impossible and the emission concern is below 30 MHz.
2. For each I/O connector: place filter capacitors between each signal pin and the chassis ground (not logic ground) as close to the connector as physically possible. These capacitors shunt common-mode noise to the chassis before it reaches the cable. Values: 100 pF to 1 nF for data lines (higher values cause signal integrity issues), larger values for power pins.
3. Design the chassis bonding: the PCB ground plane must bond to the chassis (metal enclosure) at the I/O connector with the lowest possible impedance. Use multiple ground vias from the PCB ground plane to a pad that contacts the chassis through the connector's mounting tabs or a separate bond strap. Bond impedance target: below 2.5 milliohms at the highest frequency of concern.
4. For unshielded cables (e.g., power cords, simple wire harnesses): common-mode filtering is the only defense. Place common-mode chokes on the cable entry to the PCB. Add series ferrite beads on individual lines for additional high-frequency attenuation. The combination of choke (effective to ~100 MHz) and ferrites (effective above 100 MHz) covers the full conducted emission range.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
