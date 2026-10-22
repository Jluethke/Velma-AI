# Geotechnical Site Investigation

Plan and execute the geotechnical investigation for wind turbine foundations: borehole program, in-situ testing, laboratory testing, and geotechnical model development.

## Inputs

- `turbine-layout`: Turbine positions, tower base loads (overturning moment, vertical force, horizontal shear), and number of turbines
- `site-geology`: Available geological maps, prior investigation data, and terrain classification

## Outputs

- `geotechnical-model`: Soil profile at each turbine location with design soil parameters (bearing capacity, shear strength, stiffness, water table depth)
- `foundation-design-parameters`: Allowable bearing pressure, friction angle, cohesion, modulus of subgrade reaction, and any geotechnical hazards (expansive soils, liquefiable layers, karst)

## Process

1. Design the investigation program. At minimum, one borehole per turbine location to a depth of 1.5 times the expected foundation diameter (typically 15-25 meters for onshore). Additional boreholes at the substation and along access roads. Include SPT (standard penetration test) at 1.5m intervals, CPT (cone penetration test) for continuous profiling, and pressuremeter or dilatometer tests for stiffness measurement.
2. Perform laboratory testing on undisturbed samples. Classification tests (grain size, Atterberg limits, moisture content), strength tests (triaxial compression, direct shear), consolidation tests for settlement prediction, and chemical analysis (sulfate content for concrete durability). For cohesive soils, undrained shear strength from the triaxial test governs short-term bearing capacity. For granular soils, friction angle from the CPT correlation governs bearing capacity.
3. Develop the geotechnical model. For each turbine location, create a soil profile showing layers, soil parameters, and the water table. Determine the design bearing pressure from the bearing capacity equation: q_ult = c x Nc + q x Nq + 0.5 x gamma x B x Ngamma, with appropriate partial safety factors (typically 2.0-3.0 for gravity foundations). The bearing pressure must also satisfy settlement limits (typically 25mm total, 10mm differential between tower legs).
4. Identify geotechnical hazards. Expansive clay: foundation must extend below the active zone or include a void between the foundation and expansive soil. Liquefiable sand: identify by CPT or SPT, evaluate liquefaction potential using the simplified method (Boulanger and Idriss), and design for post-liquefaction settlement or improve the ground. Karst (soluble rock with voids): require additional investigation (ground-penetrating radar, probe drilling) to map void locations. Frost heave: foundation must extend below the frost line.
5. Deliver the geotechnical interpretive report. Present the factual data, the geotechnical model, the design parameters with their characteristic and design values (per Eurocode 7 or IEC 61400-6), and recommendations for foundation type and construction methodology. The report is a key document for the foundation design engineer and is reviewed by the wind turbine manufacturer for compatibility with their tower base loads.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
