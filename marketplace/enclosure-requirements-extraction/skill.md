# Enclosure Requirements Extraction

Extract the complete set of enclosure requirements from the product specification, environment, and regulatory standards, catching requirements that are often missed until late in the design.

## Inputs

- `product-specification`: Product-level requirements including operating environment, regulatory targets, and life expectancy
- `electronics-definition`: PCB dimensions, connector count and type, total heat dissipation, and cable routing needs

## Outputs

- `enclosure-requirements`: Prioritized list of enclosure requirements: IP rating, EMI class, structural loads, thermal limits, cosmetic requirements, and safety certifications
- `environmental-profile`: Operating and storage temperature range, humidity, altitude, salt spray exposure, UV exposure, chemical exposure, and shock/vibration levels

## Process

1. Start with the IP (Ingress Protection) rating requirement. IP65 means dust-tight and protected against water jets. IP67 adds temporary immersion. Each digit drives specific sealing requirements: the first digit (solids) from 0-6, the second (liquids) from 0-9K. Higher ratings cost more and constrain thermal management.
2. Identify the EMI/EMC requirement from the regulatory standard. FCC Part 15 Class B (residential), Class A (industrial), CISPR 32, or MIL-STD-461. Each defines conducted and radiated emission limits that the enclosure shielding must help meet. A metal enclosure provides 40-80 dB of shielding; a plastic enclosure provides zero without additional treatment.
3. Define structural loads: shipping drop height (IEC 60068-2-31), operating vibration profile (automotive: random vibration per ISO 16750, industrial: sinusoidal sweep), mounting loads (cantilevered weight, cable pull forces on connectors).
4. List every opening in the enclosure: connectors, displays, buttons, ventilation, cable glands, mounting holes. Each opening is a potential failure point for sealing, shielding, and structural integrity.
5. Document cosmetic and branding requirements: surface finish, color, logo placement, label areas. These constrain material and process selection. A high-gloss finish eliminates cast aluminum (too porous) and requires painting or molded plastic.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
