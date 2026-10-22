# Enclosure Sealing Design

Design the sealing system to meet the IP rating requirement, selecting gasket materials, designing gasket grooves, and specifying fastener patterns for uniform compression.

## Inputs

- `enclosure-requirements`: IP rating and environmental requirements
- `environmental-profile`: Temperature, chemical, and UV exposure conditions

## Outputs

- `sealing-design`: Gasket material, cross-section, groove dimensions, compression specification, and fastener pattern for each sealed interface
- `connector-sealing-plan`: Sealing method for each connector and cable entry: gland, grommet, potting, or sealed connector specification

## Process

1. Select gasket material based on the environmental profile. Silicone: -60C to +200C, good compression set resistance, poor chemical resistance. EPDM: -40C to +120C, excellent weathering and ozone resistance. Neoprene: -40C to +100C, good oil resistance. Viton: -20C to +200C, excellent chemical resistance, expensive.
2. Design the gasket groove. For an O-ring: groove depth should produce 15-25% compression of the cord diameter. Groove width should be 1.2-1.5 times the cord diameter to allow room for thermal expansion and compression set. Groove corners need a radius of at least 0.5mm to prevent stress concentration in the gasket.
3. Specify the fastener pattern for uniform gasket compression. Maximum fastener spacing depends on gasket stiffness and flange rigidity. For a 3mm silicone gasket on a 3mm aluminum flange, maximum spacing is approximately 80-100mm. Closer near corners where flange bowing is greatest.
4. Design connector sealing. For IP67: use connectors with integrated sealing (rated mated and unmated). For cable entries: cable glands sized to the cable OD range, with the correct thread standard (PG, metric, NPT). Each gland must be sealed to the enclosure with an O-ring or gasket.
5. Account for gasket compression set over product life. At elevated temperature, silicone loses 10-20% of its compression force over 10 years. Design the initial compression to maintain sealing force after the expected compression set. Test per ASTM D395 at the maximum operating temperature.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
