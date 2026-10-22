# Safety Case Construction

Build the safety case as a structured argument that the system is acceptably safe, using goal structuring notation to link claims to evidence.

## Inputs

- `diagnostic-coverage-ratio`: DC calculations for all safety functions
- `failure-mode-classification`: Classified failure modes
- `proof-test-interval`: Required proof test intervals

## Outputs

- `safety-case-structure`: Goal Structuring Notation (GSN) diagram: top goal (system is acceptably safe), sub-goals (each hazard mitigated to acceptable level), strategies (how sub-goals are argued), solutions (the evidence: test results, analyses, field data)
- `evidence-index`: Every piece of evidence referenced in the safety case: test reports, analysis reports, design documents, process certifications, field data, with location and revision
- `residual-risk-register`: Every residual risk after mitigation, with its probability and severity, the risk acceptance rationale, and the authority that accepted it

## Process

1. Define the top claim: 'System X is acceptably safe for its intended use in environment Y.' This is the goal the entire safety case must support. 'Acceptably safe' means residual risk is below the tolerable risk threshold defined by the applicable standard or regulations.
2. Decompose the top claim using strategies. Strategy 1: argue over each identified hazard (show that each hazard is mitigated to an acceptable level). Strategy 2: argue over the development process (show that the process was rigorous enough for the integrity level). Strategy 3: argue over operational constraints (show that the operational procedures maintain safety). Each strategy decomposes into sub-goals.
3. Link each leaf-level goal to evidence. A claim like 'braking force meets the minimum threshold under single-fault conditions' must be supported by: the test report showing the measured braking force during the single-fault test, the test procedure traceability to the requirement, and the fault injection method used. Evidence must be objective and reproducible.
4. Identify and document assumptions and limitations. The safety case is valid under the stated assumptions (operating environment, maintenance schedule, user training). If any assumption is violated, the safety argument may not hold. List every assumption explicitly and assign monitoring responsibility to ensure they remain valid in operation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
