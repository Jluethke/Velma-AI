# Traceability Matrix Construction

Build and maintain the requirements traceability matrix linking stakeholder needs to system requirements to subsystem requirements to verification events.

## Inputs

- `allocation-matrix`: System to subsystem requirement mapping
- `performance-budgets`: Allocated performance values
- `interface-requirements`: Inter-subsystem requirements

## Outputs

- `traceability-matrix`: Bidirectional trace: each stakeholder need links forward to system requirements, to subsystem requirements, to design elements, to verification events. Each verification event links backward to the requirement it verifies.
- `orphan-report`: Requirements with no parent need (potential scope creep) and needs with no child requirement (potential gap)
- `verification-plan-skeleton`: For each requirement, the assigned verification method, the verification level (component, subsystem, system, operational), and the verification event where it will be checked

## Process

1. Construct the forward trace: need -> system requirement -> subsystem requirement -> design element -> verification event. Use unique IDs at every level. A good ID scheme encodes the hierarchy: SYS-001 allocates to SUB-A-001 and SUB-B-003, verified by TEST-SYS-001.
2. Construct the backward trace: start from each verification event and confirm it traces to at least one requirement. A test with no requirement traceability is waste (unless it is an exploratory test explicitly labeled as such). A requirement with no verification event is unverifiable.
3. Run the orphan analysis. Forward orphans: requirements that do not trace to any stakeholder need are either derived requirements (which should be labeled as such with their derivation rationale) or scope creep (which should be removed). Backward orphans: needs with no requirement coverage indicate a gap in the requirements set.
4. Assign verification methods: Test (measure performance against criteria), Analysis (calculate from models or simulations), Inspection (visual or dimensional check), Demonstration (operate the system and observe behavior). Prefer test for performance requirements and analysis for requirements that cannot be tested economically. Every requirement must have at least one method assigned.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
