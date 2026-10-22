# Casting Process And Alloy Selection

Select the casting process and alloy based on the part geometry, production volume, mechanical property requirements, and cost targets.

## Inputs

- `part-geometry`: Part shape, dimensions, weight, wall thickness range, and tolerance requirements
- `performance-requirements`: Mechanical properties (strength, ductility, hardness, fatigue, corrosion resistance), operating temperature, and production volume

## Outputs

- `selected-casting-process`: Chosen process (sand, investment, die, permanent mold, centrifugal) with rationale including tolerance capability, surface finish, and production rate
- `selected-alloy`: Alloy specification with castability characteristics (fluidity, shrinkage, hot tearing susceptibility) and expected as-cast and heat-treated properties

## Process

1. Match process to requirements. Sand casting: lowest tooling cost, no practical size limit, roughest surface (Ra 12-25 microns), widest tolerance (CT 9-12 per ISO 8062). Investment casting: finest detail and surface finish (Ra 1.6-6.3 microns), tightest tolerance (CT 5-7), economic for complex shapes in low to moderate volume. Die casting (high pressure): highest production rate (100-1000+ parts/hour), excellent repeatability, limited to low-melting alloys (Al, Zn, Mg), porosity from trapped air limits pressure-tightness and heat treatability. Permanent mold: intermediate between sand and die casting for aluminum alloys.
2. Select the alloy. For aluminum: A356 (AlSi7Mg) is the workhorse with good castability and mechanical properties after T6 heat treatment (UTS 260-310 MPa, elongation 3-8%). A357 for higher strength. 319 for complex automotive castings. For iron: ductile iron (EN-GJS-400-18, GGG40) for strength and ductility. Gray iron (EN-GJL-250) for vibration damping and wear resistance. For steel: CF8M (316 SS equivalent) for corrosion resistance. WCB (carbon steel) for structural castings. For copper: C83600 (leaded red brass) for pressure-tight valve bodies.
3. Evaluate castability. Fluidity determines the minimum wall thickness (typically 3-4mm for aluminum sand casting, 1-2mm for investment casting, 0.5-1mm for zinc die casting). Shrinkage determines the risering difficulty (aluminum shrinks 5-7% volumetrically, steel 7-10%). Hot tearing susceptibility depends on the solidification range and the alloy's ability to accommodate contraction strain (wider freezing range = higher hot tear risk).
4. Estimate the cost. The total casting cost = tooling amortization + material (metal weight including gates/risers / pour yield, typically 40-70%) + processing (mold making, melting, pouring, shakeout, finishing) + inspection + scrap rate. For low volume (1-100), sand or investment casting. For high volume (10,000+), die casting or permanent mold for aluminum, green sand for iron.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
