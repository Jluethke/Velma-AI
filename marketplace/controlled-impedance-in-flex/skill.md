# Controlled Impedance In Flex

Achieve controlled impedance in flex sections despite the different dielectric properties and thinner construction.

## Inputs

- `flex-stackup`: Flex region materials and thicknesses
- `signal-classes`: Signals requiring impedance control in the flex region
- `impedance-target`: Target impedance for flex-routed signals

## Outputs

- `flex-impedance-geometry`: Trace width and spacing for target impedance in the flex stackup, accounting for polyimide Dk and adhesive Dk
- `impedance-tolerance-in-flex`: Achievable impedance tolerance in flex (wider than rigid due to material variation and thinner dielectric)
- `flex-routing-rules`: Routing rules specific to flex: no trace on the outer bend surface, curved traces (no right angles), hatched ground planes

## Process

1. Calculate impedance using flex dielectric properties: polyimide has Dk around 3.2 to 3.5 (lower than FR-4's 4.2). Adhesive layers have Dk around 3.5 to 4.0. The effective Dk depends on the layer structure. For a microstrip on polyimide, Z0 will be higher than on FR-4 for the same geometry because the lower Dk reduces capacitance per unit length.
2. Expect wider impedance tolerance in flex: +/- 15% is typical for flex (vs +/- 10% for rigid). The thinner dielectric makes impedance more sensitive to thickness variation, and polyimide film has wider thickness tolerance than rigid laminate. If the protocol requires +/- 10%, the flex geometry must be designed with extra margin.
3. Route traces on the compression side (inner bend surface) when possible. Traces on the tension side (outer surface) experience direct tensile stress during bending and are more likely to crack. For single-sided flex, place copper on the inside of the bend.
4. Use hatched (crosshatched) ground planes instead of solid ground planes in flex regions. A solid copper plane makes the flex rigid and resistant to bending. A hatched ground plane (typically 50 to 70% copper coverage) maintains some reference plane integrity for impedance control while allowing the flex to bend. The impedance changes with hatch pattern: use the field solver to model the specific hatch geometry.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
