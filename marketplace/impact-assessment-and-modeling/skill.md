# Impact Assessment And Modeling

Assess the magnitude of environmental impacts using appropriate models and methods for each topic.

## Inputs

- `scoping-report`: Topics to assess with methodologies
- `baseline-conditions`: Existing environmental conditions

## Outputs

- `impact-assessment`: Predicted impacts by topic with significance ratings before and after mitigation
- `cumulative-effects`: Assessment of combined effects with other planned or existing projects

## Process

1. Noise assessment. Construction: predict noise levels at receptors from equipment sound power levels and distance attenuation (BS 5228 or FHWA RCNM). Calculate daily LAeq at each receptor. Compare to baseline and to threshold criteria (e.g., 75 dB LAeq at facade for significant effect during daytime construction). Operational: road traffic noise from traffic flow (CRTN, TNM, or FHWA model), rail noise from pass-by events (CRN), industrial noise from fixed plant (ISO 9613-2 propagation with meteorological correction).
2. Air quality assessment. Construction dust: qualitative risk assessment (IAQM guidance: site size, distance to receptors, dust-generating activities). Operational: atmospheric dispersion modeling (AERMOD for point and area sources, ADMS-Roads for road traffic). Input: emission rates from traffic data and emission factors (EFT, EMFAC), meteorological data (minimum 5 years hourly), terrain, buildings. Output: predicted concentrations of NO2, PM10, PM2.5 at receptors. Compare to air quality standards (NAAQS, EU limit values).
3. Ecology assessment. Habitat loss: calculate area of each habitat type lost, compare to local/regional extent. Assign value to habitats (international, national, county, local, negligible). For protected species: assess disturbance, displacement, mortality, barrier effects. Population-level impact assessment where possible (e.g., collision risk modeling for birds at wind farms). For aquatic ecology: water quality impact on fish and invertebrates.
4. Water resources assessment. Surface water: pollutant runoff modeling (simple event mean concentration or SWMM for complex), flood risk assessment (hydraulic modeling if development in floodplain), geomorphological impact on channel. Groundwater: dewatering impact assessment (drawdown prediction from pumping test data), contamination risk from construction activities, impact on groundwater-dependent ecosystems.
5. Cumulative effects. Identify other projects within the zone of influence (planning registers, infrastructure plans). Assess combined effects on each receptor: total noise from this project plus others, total traffic increase, combined habitat loss. In-combination effects for European designated sites (Habitats Regulations Assessment). Climate change: total GHG emissions in construction and operation (tonnes CO2e per year, compared to national/sectoral budgets).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
