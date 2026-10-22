# Rcm System Decomposition

Decompose the system into maintainable items and identify the functions each must perform, establishing the functional context for failure analysis.

## Inputs

- `system-description`: System architecture, operating context, and performance requirements
- `maintenance-history`: Available failure records, repair logs, and current maintenance schedule

## Outputs

- `functional-breakdown`: Hierarchical list of system functions at the system, subsystem, and component level, with performance standards for each function
- `maintenance-significant-items`: Items selected for RCM analysis based on safety, operational, or economic significance of their failure

## Process

1. Define the system's primary and secondary functions. A power supply's primary function: convert 120VAC to 12VDC at 50A with less than 1% voltage regulation. Secondary functions: provide short-circuit protection, provide input-to-output isolation of 4kV, operate without audible noise above 35 dBA.
2. Decompose to the lowest replaceable unit. For electronics: individual PCB assemblies, power supplies, fan assemblies, filter assemblies, batteries. Do not go below the field-replaceable level unless repair at a lower level is economically justified.
3. For each item, list all functions with quantified performance standards. A function without a performance standard cannot be analyzed for failure. 'Supply power' is not a function. 'Supply 12V +/-0.12V at 0-50A with less than 100mV ripple' is a function.
4. Screen items for maintenance significance. An item is maintenance-significant if its failure has safety consequences, if its failure stops production or mission, or if its failure costs more than preventive maintenance. Items with none of these consequences can run to failure.
5. Prioritize items by consequence severity. Safety-significant items must be analyzed first and most thoroughly. Operational items (production stops) second. Economic items third. This ranking drives the depth of analysis and the rigor of the maintenance task.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
