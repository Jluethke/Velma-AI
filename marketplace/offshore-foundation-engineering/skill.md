# Offshore Foundation Engineering

Design foundations for offshore wind turbines: monopile, jacket, gravity base, or floating concepts, considering wave and current loads, soil-structure interaction, and marine construction methods.

## Inputs

- `foundation-design`: Onshore design methodology adapted for offshore loading conditions
- `construction-specification`: Construction methods adapted for marine installation

## Outputs

- `offshore-foundation-design`: Foundation type, dimensions, wall thickness, grouted connection or bolted connection design, and scour protection
- `installation-methodology`: Vessel requirements, installation sequence, pile driving or suction installation parameters, and weather window requirements

## Process

1. Select the foundation type by water depth. Monopile: 0-40m water depth (single large-diameter steel pipe, 6-10m diameter, driven 20-40m into the seabed). Jacket: 25-65m (lattice steel structure with 3-4 pin piles). Gravity base: 0-30m (massive concrete or steel structure relying on weight, suitable for hard seabed). Floating (spar, semi-sub, TLP): beyond 60m depth. Monopiles account for over 80% of installed offshore wind foundations due to their simplicity.
2. Design for hydrodynamic loads. Wave loads on the monopile are calculated from Morison's equation: F = 0.5 x Cd x rho x D x |u| x u + Cm x rho x pi x D2/4 x du/dt (drag + inertia). For large-diameter monopiles (D/wavelength greater than 0.2), diffraction effects require the MacCamy-Fuchs correction. Current loads add a steady drag force. Wave and current loads are combined with wind loads for the design load cases per IEC 61400-3 (offshore wind standard).
3. Analyze soil-structure interaction. The monopile is a laterally loaded pile. Model the soil-pile interaction using p-y curves (API RP 2GEO or DNVGL-RP-C212). The p-y method provides the lateral soil resistance as a function of lateral displacement at each depth. For clay: use the Matlock soft clay or Reese stiff clay p-y curves. For sand: use the API sand p-y curves. The natural frequency of the monopile-tower system must fall between the 1P and 3P frequencies (the soft-stiff design range) to avoid resonance with rotor excitation.
4. Design the grouted or bolted connection. The transition piece connects the monopile to the tower. A grouted connection uses high-strength grout to transfer loads between the transition piece and the monopile. The grout must resist the combination of axial force, bending, and shear. Shear keys (welded ribs on both the inside of the transition piece and outside of the monopile) provide mechanical interlock. Alternatively, a bolted flange connection avoids grout but requires precise pile installation tolerances.
5. Design scour protection. Currents and waves cause scouring of the seabed around the monopile, potentially reducing the embedment depth and lateral capacity. Scour depth for a cylindrical monopile in current is approximately 1.3 x D (pile diameter). Rock armor (graded rock placed around the pile base) or concrete mattresses prevent scour. The rock armor layer is typically 0.5-1.0m thick with a D50 stone size calculated from the current velocity using the Isbash or Hudson formula.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
