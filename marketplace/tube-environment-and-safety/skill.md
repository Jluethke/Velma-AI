# Tube Environment And Safety

Design the tube or tunnel environment: pressure management, emergency ventilation, evacuation, and thermal control.

## Inputs

- `alignment-geometry`: Tube/tunnel length, cross-section, and portal locations
- `propulsion-specification`: Vehicle speed, heat rejection, and air displacement

## Outputs

- `tube-environment-design`: Pressure level, pumping system, thermal management, and ventilation for normal and emergency operations
- `emergency-egress-plan`: Evacuation routes, refuge areas, ventilation for fire scenarios, and rescue access points

## Process

1. For reduced-pressure tube systems: determine target pressure from drag analysis. Lower pressure reduces aerodynamic drag but increases pumping cost and leak management complexity. Typical target: 100 to 1000 Pa. Calculate pumping capacity: initial pumpdown volume, steady-state leak rate from joints and airlocks, air displaced by vehicle entry/exit through airlocks.
2. For conventional high-speed rail in tunnel: manage pressure waves from train entry and passage. Piston effect: train entering tunnel compresses air ahead. Micro-pressure waves emitted from tunnel exit (tunnel boom). Mitigation: enlarge tunnel cross-section (blockage ratio < 0.12 for single track), add pressure relief shafts, or install hood structures at portals to slow compression.
3. Thermal management. Heat sources: propulsion losses, braking energy, passenger metabolic heat, solar gain on exposed guideway. In a sealed tube, heat accumulates without active removal. Design heat rejection: ventilation shafts at intervals, heat exchangers along tube wall, or circulating coolant in guideway structure. Calculate thermal equilibrium: steady-state temperature rise must stay within equipment and comfort limits.
4. Emergency ventilation for fire scenarios. Design to tenable conditions: visibility > 10 m, temperature < 60 C, CO < 1000 ppm at head height along egress route. Longitudinal ventilation: jet fans or mechanical ventilation to push smoke in one direction, passengers evacuate in the other. Critical velocity to prevent backlayering: Vc = Kp * (g * H * Q / (rho * cp * T * A))^(1/3) where Q is fire heat release rate.
5. Design evacuation. Maximum distance between emergency exits: 250 m for rail tunnels (NFPA 502), may be shorter for other transport types. Cross-passages between twin-bore tunnels every 250 m. Refuge areas with fresh air supply and communication at intervals. Emergency lighting and wayfinding. Emergency walkway alongside guideway: minimum 1.2 m wide, non-slip, with handrail. Rescue train or vehicle access for injured persons.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
