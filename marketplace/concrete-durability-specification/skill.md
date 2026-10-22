# Concrete Durability Specification

Specify concrete mix, cover, and protection measures for the target service life and exposure conditions.

## Inputs

- `structural-layout`: Member locations and environmental exposure
- `crack-width-check`: Service load crack width at each section

## Outputs

- `durability-specification`: Concrete mix requirements (w/c, f'c, air entrainment, SCMs), cover depths, and protection measures for each exposure class
- `maintenance-plan`: Inspection intervals and anticipated maintenance for target service life

## Process

1. Classify exposure per ACI 318 Table 19.3.1 or Eurocode EN 206. Categories: carbonation (XC1-4), chloride from seawater (XS1-3), chloride from deicing (XD1-3), freeze-thaw (XF1-4), chemical attack (XA1-3). Each member face gets the worst applicable class.
2. Set maximum w/c ratio from exposure class. Typical: 0.45 for XS2/XD2, 0.40 for XS3/XD3. Set minimum f'c (often 35 to 45 MPa for marine/deicing exposure). Specify SCMs: fly ash (15-25%), slag (35-65%), or silica fume (5-10%) for chloride resistance. Air entrainment 4-7% for freeze-thaw (XF classes).
3. Set cover depth. ACI minimum: 40 mm for exposed to weather, 50 mm for soil/seawater. Eurocode: structural class adjusted cover from cmin table. For 100-year design life, add 10 mm to 50-year values. Consider construction tolerance (delta_c = 10 mm typically).
4. For aggressive environments, specify additional protection. Epoxy-coated rebar or stainless steel in splash zone. Concrete surface treatment (silane/siloxane sealer) for chloride exposure. Cathodic protection for submerged marine structures. Waterproofing membrane for below-grade structures.
5. Define quality control requirements. Concrete testing: slump/flow, air content, temperature at delivery. Strength: cylinders per ACI 301 (minimum 1 per 100 m3 or per day). Chloride content limit: 0.06% by mass of cite for prestressed, 0.15% for reinforced in wet conditions. Permeability test (RCPT or bulk diffusion) for high-durability specifications.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
