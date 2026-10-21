# Pollen Percentage Concentration

Convert raw counts to percentages and concentrations for each taxon.

## Inputs

- `pollen-counts`: Raw counts per taxon per sample
- `preparation-log`: Exotic marker counts and sample volumes for concentration calculation

## Outputs

- `pollen-percentages`: Each taxon as a percentage of the total terrestrial pollen sum per sample
- `pollen-concentrations`: Grains per cubic centimeter for each taxon calculated from the exotic marker ratio

## Process

1. Define the pollen sum (typically terrestrial pollen, excluding aquatics and spores)
2. Calculate the percentage of each taxon relative to the pollen sum
3. Calculate concentrations using the ratio of counted pollen to counted exotic markers
4. If an age model exists, calculate pollen accumulation rates (grains per cm-squared per year)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
