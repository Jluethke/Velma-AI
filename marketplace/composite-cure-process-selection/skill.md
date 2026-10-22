# Composite Cure Process Selection

Choose the cure process (autoclave, out-of-autoclave, or liquid molding) and define the cure cycle that reaches full cure and the target glass transition without excess porosity.

## Inputs

- `stacking-sequence`: The laminate definition, thickness, and part size driving the cure approach
- `quality-requirements`: Void content limit, surface finish, glass transition target, and production rate requirements

## Outputs

- `cure-process`: The selected process (autoclave, out-of-autoclave prepreg, or resin infusion) with the deciding factors
- `cure-cycle`: The time-temperature-pressure profile: ramp rates, dwell(s), cure temperature, pressure schedule, and vacuum level, with the degree-of-cure and glass-transition target

## Process

1. Select the process against the void-content and rate requirements. Autoclave prepreg at 6 to 7 bar reliably reaches below 1% voids and is the default for primary structure. Out-of-autoclave (OOA) prepreg under vacuum-bag-only pressure (about 1 bar) can reach 1 to 2% voids with the right material and careful debulk, and removes the autoclave bottleneck. Resin infusion (VARTM, RTM) suits large parts and dry-fiber preforms at lower tooling cost.
2. Set pressure to consolidate and suppress voids. Autoclave pressure both compacts plies and keeps dissolved volatiles in solution to limit porosity; vacuum-bag-only processes depend on a near-full vacuum and an optimized debulk schedule to pull voids out, because they lack the extra pressure. Specify the vacuum level (typically better than 5 inHg absolute, verified for leaks) for OOA.
3. Define the cure cycle to reach full degree of cure and the target glass transition (Tg). A representative epoxy cycle is a 1 to 3 C/min ramp to a 120 or 180 C dwell held 2 to 4 hours; the dwell temperature and time set the final Tg, which must sit comfortably above the maximum operating temperature with margin.
4. Add intermediate debulk steps for thick laminates. Vacuum debulking every few plies removes entrapped air and bulk factor before cure; skipping it on a thick OOA laminate is a leading cause of porosity. For thick sections, add a lower intermediate dwell to manage the exotherm and avoid a temperature overshoot that degrades the resin.
5. Match tooling coefficient of thermal expansion (CTE) and plan springback. Invar or carbon tooling minimizes CTE mismatch and warpage on precise parts; aluminum tooling is cheap but its higher CTE must be compensated. Predict spring-in on angled parts (a few degrees is common) and build the compensation into the tool, not the trim.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
