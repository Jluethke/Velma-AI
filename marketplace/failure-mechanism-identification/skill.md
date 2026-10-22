# Failure Mechanism Identification

Identify the failure mechanisms relevant to the specific package type and use environment.

## Inputs

- `package-design`: Package type, materials, dimensions, and construction
- `use-environment`: Operating temperature range, humidity exposure, mechanical loads (drop, vibration), and expected field life

## Outputs

- `failure-mode-list`: Ranked list of failure mechanisms with their physical drivers and affected locations in the package
- `risk-ranking`: Risk priority based on likelihood and consequence for each mechanism

## Process

1. Solder joint fatigue: driven by CTE mismatch between die/substrate and PCB during thermal cycling. Critical for BGA packages, especially large packages on organic boards. Highest risk at corner balls (maximum DNP).
2. Wire bond failure: heel crack from thermal cycling (CTE-driven flexing), ball lift from IMC voiding (temperature and time), wire sweep shorting (molding process). Critical for wire-bonded packages in high-temperature applications.
3. Delamination: separation at material interfaces (die attach, mold compound to die, mold compound to substrate) driven by moisture absorption and thermal stress. Leads to popcorn cracking during board-level reflow. Risk increases with moisture sensitivity level (MSL).
4. Electromigration: current-driven metal migration in solder bumps or RDL. Risk increases with current density and temperature. Critical for flip-chip bumps carrying high current (> 10^4 A/cm2).
5. Corrosion: moisture and ionic contamination penetrating the package. Critical for packages with thin or no mold compound (QFN, WLP). Humidity and bias accelerate electrochemical migration between conductors.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
