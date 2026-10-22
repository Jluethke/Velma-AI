# Nuclear Safety Analysis Methodology

Apply the safety analysis methodology for nuclear reactor licensing: design basis accidents, acceptance criteria, and defense in depth.

## Inputs

- `reactivity-control-design`: Control systems available for accident mitigation
- `shutdown-margin-analysis`: Shutdown capability under accident conditions

## Outputs

- `safety-analysis-results`: Results of the limiting design basis accidents showing compliance with acceptance criteria (peak cladding temperature, oxidation, coolable geometry)
- `defense-in-depth-assessment`: Evaluation of barrier integrity (fuel, cladding, primary boundary, containment) under normal, anticipated, and postulated accident conditions

## Process

1. Define the design basis events. These include anticipated operational occurrences (AOOs, frequency greater than 1E-2 per year: loss of feedwater, inadvertent rod withdrawal) and postulated accidents (frequency 1E-2 to 1E-6 per year: LOCA, steam line break, rod ejection). Each event is analyzed with conservative assumptions (single failure of active components, loss of offsite power coincident with the event).
2. Analyze the loss-of-coolant accident (LOCA). The large-break LOCA (guillotine rupture of the largest pipe) is analyzed in three phases: blowdown (rapid depressurization), refill (ECCS injection refills the lower plenum), and reflood (core is recovered). Acceptance criteria per 10 CFR 50.46: peak cladding temperature less than 2200F (1204C), local oxidation less than 17% of cladding thickness, hydrogen generation less than 1% of total zirconium, coolable geometry maintained, and long-term cooling assured.
3. Analyze the reactivity insertion accident (RIA). The limiting event is a control rod ejection due to a failure of the control rod drive mechanism housing. The energy deposited in the fuel must remain below 280 cal/g to prevent fuel dispersal. The analysis uses point kinetics with Doppler feedback (the fuel temperature coefficient provides inherent negative feedback that limits the power excursion).
4. Analyze the anticipated transient without scram (ATWS). Per 10 CFR 50.62, the plant must be able to maintain an acceptable condition if the reactor protection system fails to trip the reactor during an anticipated transient. This requires a diverse scram system (AMSAC for PWRs) and demonstrates that peak RCS pressure remains below the ASME Service Level C limit.
5. Assess defense in depth. The five levels: Level 1 (prevention of abnormal conditions through conservative design and quality), Level 2 (detection and control of abnormal conditions through reactor protection and control systems), Level 3 (control of design basis accidents through engineered safety features), Level 4 (mitigation of severe accidents through containment and emergency procedures), Level 5 (emergency response through offsite emergency planning). Document how each barrier (fuel matrix, cladding, reactor coolant boundary, containment) is protected at each level.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
