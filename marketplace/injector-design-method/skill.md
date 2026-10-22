# Injector Design Method

Design the injector to achieve stable, complete combustion with good mixing and acceptable heat flux to chamber walls.

## Inputs

- `mixture-ratio`: Target O/F ratio from thermochemistry
- `chamber-pressure-target-pa`: Chamber pressure
- `thrust-requirement-n`: Engine thrust to determine total mass flow

## Outputs

- `injector-type`: Selected injector type (impinging, coaxial shear, pintle, swirl) with rationale
- `element-count-and-pattern`: Number of injection elements and their arrangement on the injector face
- `pressure-drop-ratio`: Injector pressure drop as fraction of chamber pressure (drives feed system sizing)
- `combustion-efficiency-estimate`: Expected C* efficiency from element design and chamber L*

## Process

1. Select injector type based on propellant state and engine requirements. Coaxial shear (LOX post, fuel annulus) is the standard for LOX/H2 (SSME, Vulcain). Pintle injectors (single moving element) give deep throttling (SpaceX Merlin uses pintle). Impinging doublets/triplets are reliable and well-characterized for storable propellants.
2. Size the pressure drop across the injector: 15-25% of chamber pressure for stability. Higher pressure drop isolates the combustion from feed system oscillations (reduces chugging tendency). But higher pressure drop means higher pump discharge pressure, which increases turbopump power and mass.
3. Determine element count from desired spray quality. More elements give finer atomization and better mixing but increase manufacturing cost. For a coaxial injector, element counts range from 100 (small engines) to 600+ (large engines). Each element must produce droplets small enough to vaporize within the chamber L*.
4. Arrange elements to control wall heat flux. The outer row can be biased fuel-rich (film cooling) to keep the combustion gas temperature below the wall material limit. Film cooling reduces performance (unmixed propellant) but is necessary for survival of copper or nickel alloy chamber walls.
5. The injector design sets the combustion stability characteristics. Short combustion zones (high atomization quality, many small elements) have less energy stored in the combustion process and are less susceptible to acoustic instability. Element spacing relative to acoustic mode wavelengths matters.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
