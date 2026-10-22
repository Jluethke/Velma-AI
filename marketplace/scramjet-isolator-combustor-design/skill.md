# Scramjet Isolator Combustor Design

Design the isolator to contain the pre-combustion shock train and the combustor for stable supersonic combustion with adequate mixing and flameholding.

## Inputs

- `inlet-geometry`: Inlet exit conditions: Mach number, pressure, temperature, and duct cross-section
- `fuel-selection`: Fuel type (hydrogen or hydrocarbon) with properties
- `thrust-requirement`: Required thrust and specific impulse target

## Outputs

- `isolator-dimensions`: Isolator length, cross-section, and pressure rise capability
- `combustor-geometry`: Combustor length, fuel injection stations, and flameholder geometry
- `combustion-performance`: Combustion efficiency, total temperature rise, and pressure profile

## Process

1. Size the isolator: its job is to contain the pre-combustion shock train that forms when back-pressure from combustion propagates upstream. Length scales with the duct height and the incoming boundary layer thickness: L/H ~ 50*(M_entrance - 1) for turbulent boundary layers. If the shock train exceeds the isolator length, it propagates into the inlet and causes unstart.
2. Select combustor mode: at lower Mach numbers (Mach 4 to 5), dual-mode operation occurs where combustion thermally chokes the flow (ramjet mode with subsonic combustion). Above about Mach 6 to 7, the flow remains supersonic through the combustor (scramjet mode). The transition between modes must be managed.
3. Design fuel injection: for hydrogen, use wall-normal injection from the duct walls (generates a bow shock that aids mixing) or strut-based injection for deeper penetration into the core flow. For hydrocarbons, use cavity flameholders (trapped vortex provides residence time for slower hydrocarbon ignition). Injection pressure ratio must exceed the local static pressure by a factor that ensures penetration.
4. Size the combustor length from mixing and reaction requirements: hydrogen ignites in microseconds at scramjet temperatures, so the combustor is mixing-limited (length ~ 10 to 20 duct heights). Hydrocarbons have longer ignition delay (milliseconds), requiring longer combustors or pilot cavities.
5. Calculate the one-dimensional performance: apply the Rayleigh line analysis (heat addition to supersonic flow) to predict static pressure rise and Mach number change. Total temperature ratio Tt4/Tt3 sets the thrust. For scramjet mode, the exit Mach must remain supersonic.
6. Verify thermal choking margin: the maximum heat addition before the flow chokes is limited. If equivalence ratio is too high, the combustor chokes and the shock train extends into (and potentially through) the isolator. Maintain margin by limiting local equivalence ratio or staging fuel injection.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
