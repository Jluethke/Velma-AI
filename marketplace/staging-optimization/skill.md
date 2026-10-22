# Staging Optimization

Determine the number of stages and allocate delta-v and mass between them to minimize total vehicle mass or cost.

## Inputs

- `total-delta-v-budget`: Total mission delta-v including all losses and margin
- `payload-mass-kg`: Payload mass to deliver
- `available-propellant-combinations`: List of propellant options with their vacuum Isp, density, and handling considerations

## Outputs

- `stage-count`: Optimal number of stages with rationale
- `stage-delta-v-split`: Delta-v allocation per stage in m/s
- `stage-mass-estimates`: Propellant mass, structural mass, and gross mass per stage
- `payload-fraction`: Payload mass divided by gross liftoff mass

## Process

1. Apply the rocket equation per stage: delta-v = Isp * g0 * ln(m_initial / m_final). Each stage's structural index (structural mass / (structural + propellant mass)) determines how much of the mass ratio translates to useful delta-v.
2. For equal-Isp stages, the Lagrange multiplier optimization gives equal mass ratios per stage as the minimum-mass solution. Real stages have different Isp (boosters vs upper stage), so iterate numerically.
3. Structural index targets by stage type: pressure-fed storable = 0.10-0.15, pump-fed kerolox = 0.06-0.10, pump-fed hydrolox = 0.10-0.15 (hydrogen tanks are large). These are hard constraints from materials and manufacturing.
4. Each additional stage adds staging hardware mass, reduces reliability (more separation events), and increases development cost. Two stages reaches LEO; three stages for high-energy orbits or small launchers. Four stages only for solid-motor vehicles (Vega).
5. For reusable first stages, the stage must carry additional delta-v for boostback and landing (1,500-2,500 m/s depending on recovery mode), which reduces payload but amortizes hardware cost over flights.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
