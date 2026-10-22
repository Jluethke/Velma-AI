# Treatment Train Selection

Select the treatment process sequence based on raw water quality, regulatory requirements, and project constraints.

## Inputs

- `raw-water-quality`: Seasonal raw water data including contaminant profiles
- `design-flows`: Design flow rates for sizing

## Outputs

- `treatment-train`: Selected processes in sequence with design criteria for each unit
- `chemical-requirements`: Chemicals needed (coagulant, polymer, disinfectant, pH adjustment) with estimated dose ranges

## Process

1. Match contaminants to processes. Turbidity/particles: coagulation + flocculation + sedimentation + filtration (conventional treatment). Dissolved organics (TOC, color): enhanced coagulation (higher dose, lower pH) or activated carbon. Pathogens: filtration (Crypto/Giardia removal credit) plus disinfection (chlorine, UV, ozone). Iron/manganese: oxidation (aeration, chlorine, permanganate) followed by filtration. Hardness: lime softening. Taste and odor: powdered activated carbon or ozone.
2. Select coagulant. Aluminum sulfate (alum): effective pH range 5.5 to 7.5, well understood. Ferric chloride or ferric sulfate: wider pH range (4.5 to 9.0), better for cold water, lower residual aluminum. Polyaluminum chloride (PACl): faster floc formation, less sludge, performs better at low temperature. Polymer: cationic for charge neutralization, anionic/nonionic for floc building. Dose from jar test data.
3. Configure sedimentation. Conventional rectangular basins: surface overflow rate 1.0 to 2.5 m/h (40 to 100 m3/m2/d) for alum floc. Plate or tube settlers: higher rate (3 to 6 m/h) in less footprint. Dissolved air flotation (DAF): for low-turbidity, high-algae water (effective for light floc that does not settle well). Contact time typically 2 to 4 hours for conventional sedimentation.
4. Configure filtration. Rapid gravity filters: dual media (anthracite over sand) at 5 to 15 m/h. Filter depth: 600 mm anthracite, 300 mm sand. Backwash: air scour + water at 40 to 60 m/h, 15 to 20 minutes. Membrane filtration (microfiltration or ultrafiltration): absolute barrier for Crypto and Giardia (4-log removal credit), higher cost, lower chemical use. Select based on source water quality and log removal credit needed.
5. Configure disinfection. Primary disinfection: chlorine (CT concept: concentration * contact time for target log inactivation from CT tables. For 3-log Giardia at 10 C, pH 7: CT approximately 100 mg-min/L). UV: effective for Crypto (40 mJ/cm2 for 4-log), does not provide residual. Ozone: strong oxidant for taste-and-odor, Crypto inactivation, but forms bromate in high-bromide water. Secondary disinfection: chloramine for distribution system residual (lower DBP formation than free chlorine).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
