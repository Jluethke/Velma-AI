# Radiation Environment Analysis

Characterize the radiation environment for the mission orbit and duration, calculate total ionizing dose and displacement damage behind shielding, and assess single-event effect rates.

## Inputs

- `orbit-parameters`: Orbit elements, mission duration, solar cycle phase
- `spacecraft-shielding`: Shielding geometry (aluminum equivalent thickness for each component location)

## Outputs

- `radiation-dose-analysis`: TID and displacement damage dose behind shielding for each component location, with margin
- `single-event-rate-analysis`: SEU, SEL, SEFI rates for critical components with LET threshold and cross-section data

## Process

1. Define the radiation environment. Trapped protons and electrons from the Van Allen belts (AP-9/AE-9 models), solar proton events (ESP or JPL model for statistical worst-case fluence), and galactic cosmic rays (CREME96 or ISO 15390). The environment depends on orbit, solar cycle phase, and mission duration. LEO below 600 km is relatively benign; MEO through the heart of the belts (1500-6000 km) is severe; GEO sees primarily solar proton events and GCR.
2. Calculate total ionizing dose (TID). Use a radiation transport code (SHIELDOSE-2 or NOVICE) to propagate the external environment through the spacecraft shielding geometry. Output is dose (in rad(Si) or rad(GaAs)) as a function of aluminum shielding thickness. Apply a radiation design margin factor of 2x to the calculated dose for component selection.
3. Calculate displacement damage dose (DDD) for solar cells, optocouplers, and CCDs. Express as equivalent 1 MeV electron or 10 MeV proton fluence using NIEL (non-ionizing energy loss) scaling. Solar cell degradation is characterized by the remaining factor (Pmax/Pmax_BOL) vs fluence.
4. Assess single-event effects. For each critical IC, obtain the LET threshold and cross-section curve from test data or the manufacturer. Calculate the SEU rate using the CREME96 or SPENVIS tool for the mission orbit. For latch-up susceptible devices, verify that the LET threshold exceeds the environment or that current limiting and power cycling protection is in place.
5. Define mitigation strategies. For TID: shield sensitive components (spot shielding with tantalum or tungsten), use rad-hard or rad-tolerant parts, design for graceful degradation. For SEE: TMR (triple modular redundancy) for critical logic, EDAC for memory, watchdog timers for processor SEFIs, current limiters for latch-up protection.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
