# Catalyst Characterization Method

Characterize the physical and chemical properties of the selected catalyst.

## Inputs

- `selected-catalyst`: Catalyst formulation to characterize

## Outputs

- `physical-properties`: Surface area, pore size distribution, pellet density, crush strength
- `chemical-properties`: Active site density, reducibility, acid-base character, oxidation state
- `characterization-report`: Complete catalyst property sheet for engineering design

## Process

1. Measure surface area by BET nitrogen physisorption. Interpret the isotherm shape: Type I indicates microporous (zeolite), Type IV indicates mesoporous (typical supported metal catalyst). Calculate BJH pore size distribution from the desorption branch.
2. Measure active site density by chemisorption: H2 for metal catalysts (dispersion = surface atoms / total atoms), NH3-TPD for acid catalysts (total acid sites and strength distribution from desorption temperature), CO2-TPD for basic catalysts.
3. Determine oxidation state and local structure by XRD (crystalline phases, particle size from Scherrer equation), XPS (surface composition and oxidation state), and TEM (particle size distribution, morphology, spatial distribution on support).
4. Measure reducibility by TPR (temperature-programmed reduction): identifies the temperature required to activate the catalyst and whether multiple reduction steps exist. This determines the activation procedure for the industrial reactor.
5. Measure mechanical properties: crush strength for fixed-bed pellets (minimum 2 to 5 N for small pellets), attrition index for fluidized-bed catalysts (ASTM D5757), and bulk density for reactor loading calculations.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
