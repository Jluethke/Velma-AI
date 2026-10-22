# Corrosion Inspection And Life Assessment

Plan the in-service corrosion inspection program and assess the remaining life of corroded components using fitness-for-service methods.

## Inputs

- `protection-system`: Corrosion protection design and expected corrosion rates
- `design-life-calculation`: Design life and inspection interval basis

## Outputs

- `inspection-plan`: Corrosion monitoring locations (CMLs), inspection methods, intervals, and acceptance criteria
- `remaining-life-assessment`: Fitness-for-service assessment methodology for corroded components per API 579 / BS 7910, with the calculated remaining safe operating life

## Process

1. Define corrosion monitoring locations (CMLs). Place CMLs at the highest expected corrosion rate locations: bottom of horizontal vessels and piping (water dropout), downstream of flow disturbances (elbows, tees, reducers), at injection points, at the vapor-liquid interface. Minimum density: enough CMLs to characterize the worst-case condition. Group CMLs into circuits of similar corrosion behavior.
2. Select inspection methods. Ultrasonic thickness measurement (UT) for general and localized wall thinning (manual spot readings or automated scanning). Radiographic profile measurement for small-bore piping. Internal visual inspection during shutdowns (identify pitting, erosion patterns, MIC, coating breakdown). Long-range guided wave UT for rapid screening of piping runs. Corrosion probes (ER, LPR) for continuous online monitoring between inspections.
3. Calculate the remaining life. For general metal loss: remaining life = (t_actual - t_min) / corrosion rate, where t_actual is the measured minimum thickness and t_min is the required minimum thickness for pressure or structural loading per the design code. For localized corrosion (pitting, grooving), apply API 579 Part 5 / Part 6 assessment: if the remaining thickness within the corroded area exceeds the minimum required thickness calculated by the averaging rules (RSF method), the component is fit for continued service.
4. Set the inspection interval. The interval must be the lesser of: half the calculated remaining life, or the interval specified by the risk-based inspection (RBI) assessment. For high-consequence equipment, maximum interval is typically 5-10 years regardless of the calculated remaining life. Alert and action thresholds: if the measured corrosion rate exceeds the design basis, trigger an engineering review and increase the inspection frequency.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
