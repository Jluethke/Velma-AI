# Pipe Sizing And Routing

Size pipes for each service based on velocity criteria and pressure drop limits.

## Inputs

- `process-conditions`: Flow rates, fluid properties, pressures, and temperatures for each line
- `plant-layout`: Equipment arrangement and approximate pipe run lengths

## Outputs

- `pipe-schedule`: Line list with pipe size, material, schedule, and insulation for each service
- `pressure-drop-summary`: Pressure drop for each pipe run

## Process

1. Set pipe diameter from velocity criteria: liquid process lines 1 to 3 m/s, liquid pump suction 0.5 to 1.5 m/s (NPSH sensitive), gas lines 15 to 30 m/s, steam 20 to 40 m/s, two-phase per API RP 14E erosional velocity limit. Select the standard pipe size that gives velocity within the acceptable range.
2. Calculate pressure drop: delta_P = f * (L/D) * (rho * v^2 / 2) + sum(K * rho * v^2 / 2) for fittings. Use Moody friction factor from the Colebrook-White equation for turbulent flow. For laminar flow (Re less than 2100), f = 64/Re.
3. Account for fittings and valves: use equivalent length method (each elbow adds ~30 diameters, each tee ~60 diameters) or resistance coefficient (K-value) method. The 3K method (Darby) gives the most accurate results across Reynolds number ranges.
4. Select pipe material from process fluid compatibility, temperature, and pressure: carbon steel for most services, stainless steel 304/316 for corrosive or high-temperature, duplex for chloride service, lined pipe for acids. Select schedule from pressure rating per ASME B31.3.
5. Size pipe supports and set routing: maintain slope for drainage (1:200 minimum), allow for thermal expansion with expansion loops or bellows, route to minimize stress concentrations. Identify points requiring spring hangers or constant support hangers for hot lines.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
