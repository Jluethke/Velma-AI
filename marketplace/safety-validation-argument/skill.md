# Safety Validation Argument

Construct the overall safety validation argument: combine functional safety, SOTIF, and cybersecurity evidence into a structured safety case using Goal Structuring Notation.

## Inputs

- `safety-requirements`: Functional safety requirements and verification evidence
- `sotif-analysis`: SOTIF analysis results and validation evidence
- `hazard-register`: Complete hazard register with mitigations

## Outputs

- `safety-case`: Structured safety case in GSN with all evidence linked to claims
- `residual-risk-assessment`: Quantified residual risk and argument that it is acceptable

## Process

1. Structure the safety case using Goal Structuring Notation (GSN). Top goal: 'The autonomous system is acceptably safe for operation within the defined ODD.' Decompose into sub-goals: 'All identified hazards are mitigated to an acceptable level' (from HARA), 'The system meets all functional safety requirements' (from ISO 26262), 'SOTIF-related risks are acceptably low' (from ISO 21448), 'The system is resilient to cybersecurity threats' (from ISO 21434).
2. Link evidence to each claim. For functional safety claims: verification test reports showing each safety requirement is met, diagnostic coverage calculations, FMEA/FTA results, hardware failure rate calculations (PMHF). For SOTIF claims: triggering condition analysis completeness argument, simulation test results, real-world test mileage and encounter statistics, performance monitoring data from field operation. For cybersecurity claims: threat analysis, penetration test results, secure development process evidence.
3. Assess residual risk. After all mitigations, some risk remains. Quantify it: the probability of a hazardous event occurring per hour of operation, multiplied by the probability that it leads to harm. Compare against the risk acceptance criterion. For automotive: the total residual risk from all autonomous system hazards combined should be below approximately 10^-8 fatalities per hour of operation (comparable to the best human drivers). Document assumptions and limitations in the residual risk calculation.
4. Identify open items and conditions for deployment. The safety case is never fully complete before deployment; it evolves with field data. Define: conditions that must be met before deployment (all safety requirements verified, SOTIF validation targets met), monitoring requirements during operation (safety-relevant metrics, incident reporting), triggers for safety case update (new failure modes discovered, software updates, ODD expansion). The safety case is a living document maintained throughout the product lifecycle.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
