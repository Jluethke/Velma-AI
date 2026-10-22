# Material Detailed Comparison

Compare the short-listed candidate materials in detail using a weighted decision matrix with property data from reliable sources, making the final selection with documented trade-offs.

## Inputs

- `candidate-materials`: Short list of candidates
- `screening-rationale`: Why each candidate survived screening

## Outputs

- `selected-material`: Final material selection with specific alloy/grade, temper/condition, and supplier specification (ASTM, AMS, or proprietary)
- `selection-justification`: Decision matrix showing scores, weights, and the margin between the selected material and the runner-up

## Process

1. Build the decision matrix. Rows are candidate materials (specific alloys). Columns are evaluation criteria (each property plus cost and manufacturability). Assign weights to each criterion: the most critical property gets the highest weight, normalized so weights sum to 1.0.
2. Score each material on each criterion using a 1-5 scale anchored to physical values. For thermal conductivity: 1 = below 100 W/mK, 3 = 150-200, 5 = above 350. The anchoring prevents subjective drift. Use material property data from ASM International, MatWeb, or the material supplier's datasheet, not general internet sources.
3. Calculate weighted scores: S_material = sum(weight_i * score_i). The material with the highest total weighted score is the primary recommendation. The runner-up is the backup if supply or cost issues arise.
4. Perform sensitivity analysis: vary each weight by +/-20% and check if the winner changes. If a 20% weight shift changes the result, the decision is sensitive to that criterion and deserves more scrutiny. Document which criteria, if reweighted, would change the outcome.
5. Specify the selected material completely: alloy designation (e.g., 6061-T6 per ASTM B209), any additional requirements (grain direction for anisotropic properties, lot traceability for safety-critical parts, certificate of conformance), and the approved supplier list if supply chain control is needed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
