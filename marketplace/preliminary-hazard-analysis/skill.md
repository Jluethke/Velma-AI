# Preliminary Hazard Analysis

Identify system-level hazards, assess their severity, and establish the safety requirements that the design must satisfy.

## Inputs

- `system-description`: Functional description and concept of operations
- `safety-standard`: Applicable safety standard: ARP4754A/ARP4761 (aerospace), ISO 26262 (automotive), IEC 61508 (general), DO-178C (software), or MIL-STD-882 (defense)

## Outputs

- `hazard-list`: Every identified hazard with description, causal factors, affected population, and severity classification per the applicable standard
- `safety-requirements`: Design requirements derived from each hazard: what the system must do (or must not do) to prevent or mitigate the hazard
- `hazard-tracking-log`: Living document tracking each hazard through analysis, mitigation, verification, and residual risk acceptance

## Process

1. Identify hazards by systematic methods: brainstorming with domain experts, checklist-based analysis from prior similar systems, HAZOP (deviation analysis: what if the output is too high, too low, absent, intermittent, untimely), and energy-based analysis (identify all energy sources that could cause harm if uncontrolled).
2. Classify each hazard severity per the applicable standard. ARP4761: Catastrophic (loss of aircraft), Hazardous (large reduction in safety margins), Major (significant reduction), Minor (nuisance), No Safety Effect. ISO 26262: S3 (life-threatening, survival uncertain), S2 (life-threatening, survival probable), S1 (light to moderate injuries), S0 (no injuries). IEC 61508: uses consequence categories tied to the specific application.
3. For each hazard, derive safety requirements. These are 'shall not' or 'shall limit' requirements: 'The system shall not produce output exceeding X under any single failure condition.' Safety requirements are non-negotiable and cannot be traded against performance or cost. They are verified with the same rigor as functional requirements but with additional independence (IV&V).
4. Establish the hazard tracking log as a living document. Each hazard entry includes: ID, description, severity, causal factors, safety requirements derived, design mitigations applied, verification evidence, residual risk, and acceptance authority. The log is reviewed at every design review and updated whenever the design changes.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
