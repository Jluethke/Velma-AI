# Fta Top Event Definition

Define the undesired top event precisely and establish the boundary conditions for the fault tree analysis.

## Inputs

- `system-hazard`: The hazard or undesired outcome to analyze
- `system-architecture`: Block diagram or schematic of the system showing redundancy, dependencies, and operating modes

## Outputs

- `top-event-statement`: Precise, unambiguous statement of the undesired event including magnitude, duration, and conditions (e.g., 'Loss of braking force below 50% of nominal for more than 200ms during any driving condition')
- `boundary-conditions`: Physical boundary (which hardware is in scope), initial conditions (system state at analysis start), environmental conditions, and what is assumed to work correctly
- `resolution-level`: The lowest level of decomposition: replaceable unit, component, or failure mechanism

## Process

1. Write the top event as a specific, measurable, time-bounded statement. 'System fails' is too vague. 'Output voltage exceeds 5.5V for more than 10ms while load current is between 0 and 3A' is precise enough to analyze. The wording determines what gets included in the tree.
2. Define the physical boundary: list every hardware element, software function, human action, and external input within scope. Everything outside the boundary is either assumed working (favorable assumption) or assumed failed (unfavorable assumption). Document which assumption applies to each excluded item.
3. Set the resolution level based on available data. If you have component failure rates, decompose to the component level. If you only have subsystem failure rates from testing, stop at the subsystem level. Going below the data resolution creates false precision.
4. Identify the initial conditions: is the system starting from a known good state, or are pre-existing dormant failures possible? For safety systems that are tested periodically, dormant failures between test intervals are a primary contributor.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
