# Inducer And Impeller Design

Design the pump hydraulic components to deliver required head rise while avoiding cavitation.

## Inputs

- `pump-head-rise-requirement`: Required pressure rise
- `pump-flow-rate`: Volume flow rate
- `npsh-available`: Net positive suction head at pump inlet

## Outputs

- `inducer-design`: Inducer geometry (hub ratio, blade count, helix angle, suction specific speed)
- `impeller-design`: Impeller geometry (specific speed, number of stages, blade count, tip speed)
- `shaft-speed`: Pump rotational speed in rpm
- `cavitation-margin`: NPSH margin over incipient cavitation

## Process

1. The inducer is a low-solidity axial impeller at the pump inlet that raises pressure enough to prevent cavitation in the main impeller. Rocket turbopump inducers operate at suction specific speeds of 20,000-60,000 (US units), far beyond conventional pump limits, by accepting controlled cavitation on the inducer blades.
2. Inducer design: typically 2-4 blades, hub-to-tip ratio 0.3-0.5, helical blades with inlet angle matched to the relative flow angle. The inducer tip speed is limited by cavitation breakdown; higher tip speed needs more NPSH. A backflow recirculation zone forms at off-design conditions.
3. Select impeller specific speed (Ns = rpm * sqrt(Q) / H^0.75 in US units). Ns determines the impeller geometry: Ns < 1000 is centrifugal (most rocket pumps), Ns > 4000 is axial. For a single centrifugal stage, achievable head rise at 70% efficiency is about 500-2000 m of fluid head depending on tip speed.
4. Tip speed limits: for a LOX impeller, the tip speed is limited by material strength to about 200-300 m/s (Inconel or titanium). For a hydrogen impeller, tip speed can be higher because hydrogen is less dense. The shaft speed is set by tip speed / impeller radius.
5. For very high chamber pressure engines (staged combustion), a single centrifugal stage may not provide enough head rise. Options: two stages in series, or run at higher speed (requires stronger materials and better bearings). The RD-180 LOX pump uses a single stage at extreme tip speed; SSME uses three stages for the hydrogen pump.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
