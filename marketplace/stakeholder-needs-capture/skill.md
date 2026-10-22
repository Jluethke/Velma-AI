# Stakeholder Needs Capture

Elicit and document stakeholder needs in operational language, separating true needs from proposed solutions.

## Inputs

- `stakeholder-list`: All parties with a stake in the system: end users, maintainers, operators, regulators, manufacturing, business
- `concept-of-operations`: High-level operational scenarios describing how the system will be used

## Outputs

- `needs-register`: Each need stated in operational language (what the system must do or how it must behave), with source stakeholder, priority, and rationale
- `operational-scenarios`: Detailed usage scenarios covering normal operation, degraded modes, maintenance, startup, shutdown, and emergency
- `constraint-list`: Non-negotiable boundaries: regulatory requirements, interface constraints from existing systems, budget and schedule limits, environmental operating conditions

## Process

1. Interview each stakeholder group separately. Use operational scenarios as conversation anchors: 'Walk me through a typical day using this system.' Capture what they need the system to do, not how they think it should work. When a stakeholder says 'I need a button that does X,' record the need as 'operator must be able to X' and note the proposed solution separately.
2. Identify conflicting needs across stakeholder groups. Manufacturing wants fewer variants. Field service wants modular replaceable units. End users want minimum weight. Regulatory wants redundancy. Document each conflict explicitly and flag for resolution during requirement derivation.
3. Capture constraints separately from needs. Constraints are non-negotiable (regulatory, physics, existing interface specs). Needs have flexibility. Mixing them causes teams to treat everything as fixed, preventing trade-offs on needs that should be traded.
4. Validate the needs register by reviewing operational scenarios end-to-end. For each scenario step, verify at least one need covers the required system behavior. Gaps in coverage indicate missing needs.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
