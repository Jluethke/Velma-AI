# Ntp Safety And Ground Testing

Design the safety case for a nuclear engine and plan the ground test campaign, addressing the unique challenge of testing a nuclear rocket on Earth.

## Inputs

- `core-geometry`: Reactor design details
- `engine-performance`: Operating conditions and burn profiles
- `mission-profile`: Launch vehicle integration and mission timeline

## Outputs

- `safety-analysis`: Nuclear safety assessment covering all mission phases
- `ground-test-plan`: Test facility requirements and test sequence
- `regulatory-pathway`: Required approvals from NRC, DOE, EPA, and NASA

## Process

1. Perform nuclear safety analysis for each mission phase: pre-launch (reactor is cold, subcritical, no fission products), launch (vibration, acoustics, abort scenarios), in-space operation (reactor startup, burns, coast with hot fission products), and disposal (final orbit or heliocentric trajectory to avoid Earth re-entry for hundreds of years).
2. Analyze launch abort scenarios: reactor has no fission products before first startup, so a launch abort is a conventional hazmat scenario (uranium fuel, but no volatile fission products). After first burn, fission products create a radioactive inventory. The Safety Analysis Report must show that no credible accident results in a fission product release that exceeds dose limits at the launch site boundary.
3. Address inadvertent criticality: design must prevent criticality from impact compaction (demonstrate by analysis and test that the core geometry change from credible impacts does not create a critical configuration) and from water flooding (moderator exclusion). Use inherent safety features: the control drums must be in shutdown position and mechanically locked during launch.
4. Plan ground testing: the primary challenge is capturing the radioactive exhaust. Options: (1) nuclear furnace approach (NERVA heritage): route exhaust through a scrubber system to capture fission products before atmospheric release. (2) Contained test: run the reactor at reduced power in a containment vessel. (3) Non-nuclear heated testing: use electric heaters to simulate reactor heating of hydrogen for turbopump and nozzle qualification, then perform a limited nuclear test for integrated performance.
5. Identify regulatory pathway: NASA Safety Review (INSRP - Interagency Nuclear Safety Review Panel) for any nuclear launch. NRC for reactor operations. DOE for nuclear material handling. NEPA for environmental impact assessment of ground testing. The regulatory process typically takes 3 to 5 years.
6. Design the ground test sequence: cold flow tests (hydrogen flow without nuclear heating), electrically heated tests (resistance heaters simulate reactor power for system checkout), low-power nuclear tests (reactor at 1 to 10% power for neutronic characterization), full-power tests (full thrust duration with exhaust capture).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
