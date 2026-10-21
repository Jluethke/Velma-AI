# Exposure Pathway Characterizer

Characterize the exposure pathways and estimate the magnitude, frequency, and duration of exposure for the population of concern.

## Inputs

- `agent-name`: Name or CAS number of the substance
- `exposure-context`: Where and how exposure occurs

## Outputs

- `exposure-estimate`: Quantified exposure by pathway (mg/kg/day or equivalent)
- `exposure-scenario`: Description of the exposure scenario including population, duration, and route

## Process

1. Map the exposure pathways from source to receptor (ingestion, inhalation, dermal)
2. Estimate concentrations in each medium (air, water, soil, food)
3. Apply intake parameters (body weight, inhalation rate, contact rate) for the target population
4. Calculate the average daily dose for each pathway and the total

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
