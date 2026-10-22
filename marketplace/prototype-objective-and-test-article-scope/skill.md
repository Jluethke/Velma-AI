# Prototype Objective And Test Article Scope

Turn a vague design goal into one or two falsifiable questions and scope the smallest test article that can answer them.

## Inputs

- `design-goal`: The performance or behavior the design must achieve, stated with a target and a tolerance (for example: burst pressure above 450 psi with margin 1.5)
- `known-unknowns`: The list of physics, interfaces, or manufacturing risks the team cannot predict confidently from analysis alone

## Outputs

- `test-questions`: One or two falsifiable questions, each with a pass/fail threshold and the measurement that decides it
- `article-scope`: The minimum feature set, fidelity level, and interfaces the test article must carry to answer the questions, plus what it deliberately omits

## Process

1. Write each open risk as a question that a single measurement can answer yes or no. 'Is the design good?' is not testable. 'Does the bracket survive 10,000 cycles at 2.5 kN without a visible crack?' is. Cap the first article at one or two questions; a test that answers five questions at once usually answers none of them cleanly.
2. Rank the questions by the product of uncertainty and consequence. A high-consequence item you already understand (bolt preload) does not need a prototype. A low-consequence item you cannot predict (flow separation in a novel duct) might. Spend the first article on the highest uncertainty-times-consequence item.
3. Strip the article to only the features that bear on the question. If the question is about weld fatigue, the article needs the weld joint, the local load path, and representative material and thickness, not the full assembly. Every feature you add costs build time and adds a confound.
4. Decide the fidelity deliberately: geometry-representative, material-representative, process-representative, or all three. A 3D-printed plastic airflow model answers aerodynamic shape questions at 1/50th the cost of a machined metal one, and tells you nothing about structural margin. Name which questions the chosen fidelity can and cannot answer.
5. Set the kill threshold now, before building. Write the number at which you abandon this concept rather than iterate it. Teams that set the kill line after seeing data move it; teams that set it first stop sunk-cost iteration.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
