# Propulsive Landing Trajectory

Design the trajectory for propulsive return and landing of a first stage booster.

## Inputs

- `stage-delta-v-split`: First stage delta-v allocation (determines MECO velocity)
- `landing-site-location`: Return to launch site (RTLS) or downrange barge/pad
- `stage-mass-estimates`: Stage dry mass and residual propellant mass at MECO

## Outputs

- `return-delta-v-budget`: Delta-v for boostback, entry burn, and landing burn
- `propellant-reserve-for-landing`: Propellant mass reserved for return (reduces payload capacity)
- `landing-trajectory-profile`: Altitude, velocity, and engine timeline for the return phase
- `payload-penalty`: Payload capacity reduction from expendable mode due to landing propellant reserve

## Process

1. RTLS (return to launch site): requires a boostback burn to reverse the downrange velocity. For a stage separating at Mach 6-10, the boostback delta-v is 1,000-2,000 m/s. Then an entry burn at the atmosphere interface (300-600 m/s) to reduce heating and loads, then a landing burn (300-500 m/s). Total return delta-v: 1,500-3,000 m/s. Payload penalty: 30-50%.
2. ASDS (autonomous spaceport droneship): the stage continues downrange and lands on a floating platform. No boostback needed. Entry burn and landing burn only. Total return delta-v: 500-1,200 m/s. Payload penalty: 15-30%. Used for high-energy missions where RTLS costs too much payload.
3. Landing burn design: the final landing burn starts at 500-1000 m altitude, 200-300 m/s velocity. A single engine (minimum throttle still exceeds 1g for most engines, so the burn must be timed precisely). The hover-slam (suicide burn) starts late and decelerates at >1g to touchdown at near-zero velocity. No hover capability means zero margin for timing error.
4. Entry burn: fired at approximately 70 km altitude and Mach 5-8 to create a virtual shock ahead of the vehicle, reducing aerodynamic heating and loads on the engine section. Burns for 15-20 seconds using 3 engines. Without this burn, the engine bells and octaweb would be damaged by reentry heating.
5. The payload penalty is the cost of reusability in performance. Calculate by comparing propellant mass budgeted for return against the rocket equation: each kg of landing propellant reduces payload by the inverse of the payload fraction. A vehicle with 2% payload fraction loses 50 kg of payload per kg of return propellant.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
