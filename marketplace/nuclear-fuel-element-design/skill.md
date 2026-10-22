# Nuclear Fuel Element Design

Design the fuel element: pellet geometry, cladding selection, gap conductance, fission gas management, and burnup limits.

## Inputs

- `neutronics-design`: Assembly geometry and enrichment for fuel rod specifications
- `neutron-economy-analysis`: Burnup target and power density for thermal limits

## Outputs

- `fuel-rod-design`: Pellet dimensions, cladding material and thickness, gap fill gas, plenum volume, and maximum burnup limit
- `fuel-performance-limits`: Maximum linear heat rate, centerline temperature limit, internal pressure limit, and cladding strain limit

## Process

1. Design the fuel pellet. UO2 pellets are typically 8-10mm diameter, 10-12mm height, with dished ends to accommodate axial thermal expansion and chamfered edges to ease loading. Theoretical density of UO2 is 10.97 g/cm3; pellets are sintered to 94-96% TD. Lower density provides porosity for fission gas storage but reduces uranium loading.
2. Select cladding material. Zircaloy-4 and M5 (Zr-Nb alloy) are standard for PWRs. Zirconium has a low thermal neutron absorption cross section (0.18 barns) and adequate corrosion resistance below 360C. Cladding thickness is 0.57-0.65mm, balancing neutron economy against burst and collapse strength. Advanced accident-tolerant fuels (Cr-coated Zr, FeCrAl, SiC/SiC) are entering qualification for enhanced high-temperature performance.
3. Design the pellet-cladding gap. Initial gap of 80-100 micrometers filled with helium (high thermal conductivity: 0.15 W/m-K at 300C). Gap conductance improves as burnup increases and the pellet swells into the cladding (pellet-cladding interaction). The gap conductance model (Ross-Stoute or equivalent) calculates the effective heat transfer coefficient across the gap as a function of gap width, gas composition, and contact pressure.
4. Size the fission gas plenum. Fission produces about 30 cm3 of gas (at STP) per MWd/kgU of burnup. At high burnup (50-60 MWd/kgU), fission gas release from the pellet matrix can reach 5-15% of total gas produced. The plenum volume (at the top of the fuel rod) must accommodate this gas without exceeding the internal pressure design limit (typically 15-17 MPa at end of life). Plenum-to-fuel volume ratio is typically 0.05-0.10.
5. Verify fuel performance limits. Maximum centerline temperature must stay below the UO2 melting point (2840C for fresh fuel, decreasing with burnup) with margin (limit typically set at 2590C). Maximum linear heat rate (power per unit length of fuel rod) is limited by centerline temperature, typically 40-44 kW/m for steady state. Cladding strain limit (1% plastic strain) prevents pellet-cladding mechanical interaction failures during power ramps.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
