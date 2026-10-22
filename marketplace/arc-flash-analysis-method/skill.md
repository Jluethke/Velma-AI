# Arc Flash Analysis Method

Perform arc flash analysis per IEEE 1584 to determine incident energy, arc flash boundaries, and required PPE at each working location in the power system.

## Inputs

- `relay-settings`: Protection device clearing times that determine arc duration
- `coordination-study`: Fault clearing sequence for arc duration calculation at each bus

## Outputs

- `arc-flash-results`: Incident energy in cal/cm2 at each bus, arc flash boundary distance, and required PPE category
- `arc-flash-labels`: Equipment labels per NFPA 70E with incident energy, boundary, PPE requirement, and working distance

## Process

1. Determine the arcing current. IEEE 1584-2018 provides empirical equations for arcing current as a function of bolted fault current, system voltage, electrode gap, electrode configuration (VCB, VCBB, HCB, VOA, HOA), and enclosure size. The arcing current is less than the bolted fault current because the arc impedance limits current. Calculate arcing current for both the maximum and reduced (85%) bolted fault current to capture the worst case (reduced arcing current may result in longer clearing time and higher incident energy).
2. Determine the arc duration. The arc duration is the time from arc initiation to the upstream protective device clearing the fault. Read the clearing time from the relay or fuse time-current curve at the arcing current (not the bolted fault current). For current-limiting fuses, the clearing time is less than one half-cycle for currents above the fuse's current-limiting threshold.
3. Calculate incident energy. IEEE 1584-2018: E = Cf x En x (t/0.2) x (610^x / D^x), where the intermediate variables come from the electrode configuration model. The working distance D is the distance from the arc source to the worker's face and chest (typically 455mm for low-voltage switchgear, 910mm for medium-voltage). Express results in cal/cm2.
4. Determine the arc flash boundary. The arc flash boundary is the distance at which incident energy equals the onset of second-degree burn (1.2 cal/cm2). Solve the incident energy equation for distance D where E = 1.2. This boundary defines the restricted approach zone where PPE is required.
5. Assign PPE categories per NFPA 70E Table 130.7(C)(15)(c). Category 1: 4 cal/cm2 (arc-rated shirt and pants, safety glasses). Category 2: 8 cal/cm2 (arc-rated shirt, pants, face shield, hard hat). Category 3: 25 cal/cm2 (arc flash suit with hood). Category 4: 40 cal/cm2 (multi-layer arc flash suit). Above 40 cal/cm2, work is not permitted until the hazard is reduced (de-energize, add faster protection, or install arc-resistant switchgear). Generate equipment labels with all required information.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
