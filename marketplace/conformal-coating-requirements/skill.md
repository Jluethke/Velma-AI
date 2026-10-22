# Conformal Coating Requirements

Define what the conformal coating must protect against and what areas must remain uncoated, translating the operating environment into coating performance requirements.

## Inputs

- `operating-environment`: Temperature range, humidity exposure, chemical exposure, condensation risk, salt spray, altitude, and expected product life
- `pcb-assembly-details`: Component types, connector locations, test points, adjustment potentiometers, and RF-sensitive areas

## Outputs

- `coating-performance-requirements`: Required insulation resistance, temperature range, chemical resistance, flexibility, and applicable standards (IPC-CC-830, MIL-I-46058C, or UL746E)
- `masking-map`: Drawing showing keep-out zones that must not be coated: connectors, test points, mounting holes, switches, LEDs, sensors, and heat sink interfaces

## Process

1. Identify the primary threat. High humidity with temperature cycling causes condensation on cold PCB surfaces, leading to electrochemical migration between conductors and eventual short circuits. Salt spray creates conductive paths. Chemical exposure (cleaning fluids, fuels, solvents) can dissolve some coating types.
2. Set the insulation resistance requirement. IPC-CC-830 requires a minimum of 10^8 ohms after humidity exposure for qualified coatings. For fine-pitch components (below 0.5mm spacing), higher insulation resistance may be needed. The coating must maintain this resistance at the maximum operating humidity and temperature.
3. Define the temperature range. The coating must remain flexible and adherent from the minimum storage temperature to the maximum operating temperature. Many coatings become brittle below -40C, cracking and delaminating from the PCB. The CTE mismatch between coating and substrate drives this failure.
4. Map every keep-out area on the assembly drawing. Connectors: mating surfaces must be uncoated. Test points: any point that will be probed during in-circuit test or field service. Adjustment components: potentiometers, DIP switches. Thermal interfaces: heat sink mounting pads. RF areas: antenna traces and matching networks (coating changes the dielectric constant and detunes the circuit). Board edge contacts.
5. Select the applicable standard. Commercial electronics: IPC-CC-830 Class 1 (general) or Class 2 (high-reliability). Military: MIL-I-46058C Type AR/UR/SR/ER/XY. Automotive: may reference IPC-CC-830 plus the OEM's specific requirements for temperature cycling and chemical resistance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
