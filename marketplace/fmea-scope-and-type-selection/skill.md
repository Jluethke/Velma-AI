# Fmea Scope And Type Selection

Define the FMEA boundary and select the correct variant (functional, design, or process) based on the system lifecycle stage and available data.

## Inputs

- `system-description`: Block diagram or functional description of the system under analysis
- `lifecycle-stage`: Current phase: concept, detailed design, prototype, production, or field return

## Outputs

- `fmea-type`: Selected variant: functional FMEA (concept stage, function-level), design FMEA (detailed design, component-level), or process FMEA (manufacturing, process-step-level)
- `analysis-boundary`: Defined scope: which subsystems, interfaces, and operating conditions are included
- `ground-rules`: Assumptions about single vs multiple failures, environmental conditions, and maintenance state

## Process

1. Identify whether the goal is to analyze intended functions (functional FMEA), physical implementation (design FMEA), or manufacturing/assembly steps (process FMEA). Functional FMEA works from a functional block diagram. Design FMEA works from schematics and BOMs. Process FMEA works from a process flow diagram.
2. Define the analysis boundary by listing every subsystem, interface, and operating mode in scope. Exclude items already covered by a lower-level FMEA unless their failure propagates across the boundary.
3. State ground rules: assume single-point failures unless the system has no redundancy, in which case common cause failures become primary. Document assumed environmental conditions (temperature range, vibration profile, EMI environment) and maintenance intervals.
4. Select the FMEA standard to follow: SAE J1739 for automotive, ARP5580 for aerospace, IEC 60812 for general. Each defines different column sets and rating scales.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
