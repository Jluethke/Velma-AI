# Raw Water Characterization

Characterize raw water quality and quantity to establish design basis for treatment.

## Inputs

- `water-source`: Source type (river, lake, reservoir, groundwater) and location
- `demand-projection`: Peak and average daily demand, projected population and growth rate

## Outputs

- `raw-water-quality`: Seasonal water quality data: turbidity, color, TOC, alkalinity, hardness, pH, temperature, microbial, and regulated contaminants
- `design-flows`: Average day, maximum day, and peak hour design flows with future expansion allowance

## Process

1. Collect minimum 12 months of raw water quality data (monthly sampling, more frequent during events). Key parameters: turbidity (NTU), color (TCU), total organic carbon (TOC, mg/L), alkalinity and pH (for coagulation design), temperature (affects reaction rates), dissolved oxygen, iron, manganese, ammonia.
2. Test for regulated contaminants: total coliforms, E. coli, Cryptosporidium and Giardia (if surface water), disinfection byproduct precursors (THM and HAA formation potential), lead and copper (at distribution system), nitrate, arsenic, fluoride, PFAS (emerging contaminant).
3. Characterize seasonal variation. Turbidity spikes from runoff events (spring melt, storms). Algae blooms in summer (taste-and-odor compounds: geosmin, MIB). Low temperature in winter (affects coagulation kinetics, slower settling). Plot exceedance curves for key parameters to identify design conditions.
4. Calculate design flows. Average day demand from per-capita demand * population + industrial/commercial. Maximum day: average day * peaking factor (1.5 to 2.0 depending on climate and system characteristics). Peak hour: maximum day * hourly peaking factor (1.5 to 1.8). Include fire flow if treatment plant supplies it directly. Add 10 to 20% for future growth or system losses.
5. Assess treatability. Jar testing: vary coagulant dose and pH to find optimum for turbidity and organics removal. Settle for 30 minutes, filter through Whatman No. 1, measure residual turbidity, color, and TOC. Repeat at different raw water qualities (low turbidity, high turbidity, cold water). This data drives coagulant selection and dose range for design.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
