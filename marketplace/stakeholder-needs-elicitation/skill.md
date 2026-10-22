# Stakeholder Needs Elicitation

Systematically identify and document stakeholder needs through interviews, observation, prototyping, and CONOPS analysis.

## Inputs

- `stakeholder-register`: List of stakeholder groups with their roles and authority
- `system-context`: Operational environment and mission description

## Outputs

- `needs-register`: Structured list of stakeholder needs with source, priority, and acceptance criteria
- `conops-document`: Concept of operations describing how the system will be used in its operational environment

## Process

1. For each stakeholder group, select the elicitation technique by stakeholder type: end users respond best to observation and prototyping (they show needs they cannot articulate), domain experts to structured interviews (they can articulate constraints), acquirers to CONOPS review (they care about operational fit).
2. Conduct elicitation sessions. For interviews, use open questions first (what problems do you face?), then probing questions (what happens when X fails?), then confirming questions (so the need is Y, correct?). Record verbatim statements.
3. Transform raw statements into structured needs: each need has a unique ID, source stakeholder, verbatim statement, interpreted need (rewritten for clarity), priority (must/should/could from MoSCoW), and acceptance criteria (how the stakeholder will judge satisfaction).
4. Build the CONOPS by sequencing needs into operational scenarios: normal operation, degraded modes, maintenance, startup, shutdown, emergency. Identify needs that conflict between stakeholders and flag for resolution.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
