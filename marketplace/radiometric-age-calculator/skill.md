# Radiometric Age Calculator

Calculate the age from corrected isotope ratios with full uncertainty propagation.

## Inputs

- `corrected-ratios`: Blank- and common-lead-corrected isotope ratios
- `dating-system`: Decay constants and age equation to use

## Outputs

- `calculated-age`: Age with 2-sigma uncertainty
- `concordance-assessment`: For U-Pb: concordia age or degree of discordance

## Process

1. Apply the appropriate age equation for the dating system
2. Propagate all sources of uncertainty (analytical, blank, decay constant, common lead model)
3. For U-Pb, plot on concordia and assess concordance or discordance
4. For isochron systems, regress the data and assess MSWD

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
