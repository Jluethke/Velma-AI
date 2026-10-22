# Sysml Model Structure Builder

Establish the SysML model structure: package hierarchy, diagram plan, and stereotype/profile definitions for the project.

## Inputs

- `system-scope`: Boundary of the system being modeled, including external actors and interfaces
- `stakeholder-concerns`: Key questions each stakeholder group needs the model to answer

## Outputs

- `model-package-structure`: Hierarchical package tree (requirements, structure, behavior, parametric, analysis) with ownership and access rules
- `diagram-plan`: List of planned diagrams by type (BDD, IBD, act, sd, stm, par, req) with purpose and owner

## Process

1. Define the top-level package structure: Requirements (organized by stakeholder), Structure (BDD hierarchy from system to component), Behavior (activity diagrams for operational scenarios, state machines for modes), Parametric (constraint blocks for physics and trade studies), Analysis (viewpoints for specific stakeholder concerns).
2. For each stakeholder concern, identify which diagram types answer it. A reliability engineer needs parametric diagrams linking failure rates; a software architect needs IBDs showing data flow. Map concerns to diagrams.
3. Define stereotypes needed beyond base SysML. Common additions: environment block (external system not under design authority), interface block (reified interface), constraint (physics equation), test case (linked to requirement via verify relationship).
4. Set model governance rules: naming convention (camelCase for properties, PascalCase for blocks), change control (who can modify which packages), review gates (model reviews at SRR, PDR, CDR milestones).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
