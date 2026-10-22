# Functional Architecture Derivation

Derive the functional architecture from operational scenarios using activity diagrams, then decompose into a function hierarchy.

## Inputs

- `model-package-structure`: Established SysML model with package hierarchy
- `operational-scenarios`: Use cases or operational scenarios the system must support

## Outputs

- `functional-architecture`: Hierarchy of system functions with input/output flows, organized by operational mode
- `function-to-requirement-trace`: Traceability from each function to the requirements it satisfies

## Process

1. For each operational scenario, build an activity diagram showing the sequence of actions the system performs. Use swim lanes for external actors. Identify object flows (data, energy, material) between actions.
2. Extract the unique actions across all scenarios. These are the system's functions. Group by abstraction level: mission functions (what the system achieves), operational functions (how it achieves them), and implementation functions (mechanism-specific).
3. Build the function hierarchy as a BDD where the top-level system block is composed of functional blocks. Each functional block has ports typed by the flows it consumes and produces.
4. Link each function to the requirements it satisfies using SysML satisfy relationships. Functions with no requirement link are either missing requirements (gap) or unnecessary functions (bloat). Flag both.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
