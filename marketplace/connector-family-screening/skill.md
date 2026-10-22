# Connector Family Screening

Screen connector families against the requirements to produce a short list of viable connector types, eliminating families that cannot meet any single hard constraint.

## Inputs

- `connector-requirements`: All requirements with pass/fail thresholds
- `interface-constraints`: Board, cable, and assembly constraints

## Outputs

- `candidate-connectors`: Short list of 3-5 connector families with specific part numbers, each meeting all hard constraints
- `screening-log`: Record of which families were eliminated and why, to prevent revisiting dead ends

## Process

1. Apply hard constraint filters in order of most restrictive first. Environmental rating (IP/mil-spec): eliminates most consumer-grade connectors for outdoor or vehicle applications. Pin count: eliminates families that max out below the required count. Controlled impedance: eliminates all non-impedance-matched families.
2. For each surviving family, check availability in the required configuration: right-angle vs vertical, through-hole vs surface-mount, plug vs receptacle, panel-mount vs free-hanging. Many connector families have gaps in their configuration matrix.
3. Verify the termination method matches the cable type and assembly process. Crimp: requires the correct crimp tool (often $200-$2000 per connector family, and the wrong tool damages the contact). Solder: manual assembly, thermal mass may damage adjacent contacts. IDC (insulation displacement): fast assembly but limited to specific wire gauges. Press-fit: no soldering, good for high-reliability applications.
4. Check the supply chain. At least two sources (manufacturer or authorized distributor) for production. Lead time under 12 weeks. Not on any end-of-life or last-time-buy notice. For military/aerospace: QPL-listed sources per the applicable MIL-DTL specification.
5. Short-list 3-5 candidates with specific part numbers. For each, record: manufacturer, series name, pin count, current rating, voltage rating, environmental rating, mating cycles, PCB footprint dimensions, and unit cost at target volume.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
