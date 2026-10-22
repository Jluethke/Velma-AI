# Bearing Seal Rotor Design

Select bearings and seals for cryogenic turbopump service and verify rotordynamic stability.

## Inputs

- `shaft-speed`: Rotational speed
- `turbine-design`: Turbine loads and thermal environment
- `pump-flow-rate`: Fluid properties at bearing locations

## Outputs

- `bearing-selection`: Bearing type, material, and life estimate for each bearing location
- `seal-configuration`: Seal types between fluid zones (interstage, turbine-pump, shaft seals)
- `rotordynamic-analysis`: Critical speed map, stability margin, and unbalance response
- `life-limiting-component`: The component that sets the engine life and its failure mechanism

## Process

1. Ball bearings with silicon nitride (Si3N4) balls and steel races are standard for LOX turbopumps. DN number (bore mm x rpm) for rocket turbopumps exceeds 2-3 million, at the limit of rolling element bearing technology. Bearing life (L10) is often the life-limiting component of the engine.
2. Hydrostatic bearings use the pumped fluid as the bearing lubricant. No wear surfaces, theoretically infinite life, and they provide damping for rotordynamic stability. But they require tight clearances (10-50 micrometers) and can fail if contamination or thermal distortion closes the gap.
3. Seal design: the seal between the oxidizer pump and turbine is safety-critical. LOX leaking into the turbine (where hot fuel-rich gas flows) causes a fire. Purge gas (helium) maintains a barrier. Interpropellant seals use multiple stages with drain cavities between them.
4. Rotordynamic analysis: map critical speeds (first bending mode, rigid body modes on bearings) versus operating speed. The operating speed should have at least 20% margin from any critical speed. Cross-coupled stiffness from seals and impeller forces can drive subsynchronous instability.
5. For reusable engines, bearing and seal life must cover multiple missions with inspection intervals. The SSME turbopumps were the most maintenance-intensive components, requiring overhaul every 10-20 flights. SpaceX designed Raptor for longer bearing life using different materials and lower DN.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
