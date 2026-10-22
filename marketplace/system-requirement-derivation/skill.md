# System Requirement Derivation

Transform stakeholder needs into verifiable system-level requirements with measurable acceptance criteria.

## Inputs

- `needs-register`: Documented stakeholder needs
- `operational-scenarios`: Usage scenarios
- `constraint-list`: Fixed boundaries

## Outputs

- `system-requirements`: Each requirement with unique ID, 'shall' statement, measurable acceptance criterion, verification method (test, analysis, inspection, demonstration), source need traceability, and rationale for derived requirements
- `derived-requirements`: Requirements not directly traceable to a stakeholder need but necessary for the system to function (e.g., internal interface requirements, built-in-test requirements)
- `tbd-list`: Requirements where the acceptance criterion cannot yet be quantified, with the plan and deadline to resolve each

## Process

1. Convert each need to one or more 'shall' statements with measurable criteria. 'System must be reliable' becomes 'System shall achieve MTBF greater than 5,000 hours as demonstrated by reliability prediction per MIL-HDBK-217F Parts Stress method at 40 degrees C ambient.' Every requirement must be verifiable by at least one method.
2. Identify derived requirements: requirements that no stakeholder asked for but are necessary. If the system must operate at -40C, and the display technology selected does not work below -20C, a derived requirement for display heating is needed. Trace each derived requirement to the parent requirement and the design decision that created it.
3. Apply the INCOSE good requirement checklist: necessary (traceable to a need), unambiguous (single interpretation), achievable (within state of the art), verifiable (measurable acceptance criterion), singular (one requirement per statement), complete (no TBD values without a resolution plan).
4. Resolve conflicts between requirements by trade study or by escalating to the stakeholder who owns the conflicting needs. Document the resolution rationale. A resolved conflict becomes a design decision that may generate additional derived requirements.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
