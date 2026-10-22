# Hazard Identification Hazop

Conduct a HAZOP study to systematically identify hazards in the process.

## Inputs

- `process-pid`: Process and instrumentation diagrams for the system under study
- `design-intent`: Design intent for each node including normal operating parameters

## Outputs

- `hazop-worksheets`: Completed HAZOP worksheets with deviations, causes, consequences, safeguards, and actions
- `action-items`: List of recommended actions ranked by risk

## Process

1. Divide the process into study nodes at logical process boundaries (vessels, major equipment, pipe sections between control valves). Define the design intent for each node: normal flow, temperature, pressure, composition, level, and phase.
2. Apply guide words systematically to each parameter: NO/NOT, MORE, LESS, AS WELL AS, PART OF, REVERSE, OTHER THAN. For each meaningful deviation, identify all credible causes.
3. For each cause, identify the consequences assuming all protection layers fail. Rate the severity of the worst credible consequence. Then identify existing safeguards (alarms, trips, relief devices, procedures) and assess whether the residual risk is acceptable.
4. Record actions for unacceptable risks: additional instrumentation, design changes, procedures, or further study. Assign each action to an owner with a due date.
5. For high-consequence scenarios, flag for Layer of Protection Analysis (LOPA) to determine if an additional safety instrumented function is required.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
