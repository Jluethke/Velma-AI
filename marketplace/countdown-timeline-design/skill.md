# Countdown Timeline Design

Design the countdown timeline from vehicle rollout through T-0 and liftoff.

## Inputs

- `vehicle-configuration`: Vehicle type, propellant combination, and ground support requirements
- `pad-systems-capability`: Ground support equipment capability and constraints
- `launch-window-schedule`: Available launch window duration and timing

## Outputs

- `countdown-timeline`: Sequenced timeline of all operations from rollout through T-0
- `hold-points`: Built-in hold points for verification and go/no-go decisions
- `recycle-plan`: Procedures for restarting the countdown after a hold or scrub

## Process

1. Work backward from T-0: engine ignition and release happens at T-0 or T-3 seconds (after engine health check). Before that: arm flight termination system, switch to internal power, retract umbilicals, final pressurization, terminal countdown sequence (usually automated in the last 30-60 seconds).
2. Propellant loading: for cryogenic propellants, loading begins T-4 to T-8 hours. LOX is loaded first (denser, lower tank), then fuel (RP-1 can be loaded earlier since it is storable at room temperature). LH2 loading requires continuous topping to replace boiloff. For subcooled/densified propellants (SpaceX), loading occurs late in the countdown (T-35 minutes for Falcon 9).
3. Chill-down: before engine start, the turbopumps and feed lines must be cooled to cryogenic temperature to prevent cavitation and thermal shock. Chill-down uses propellant bleed through the engine and lasts 5-30 minutes depending on engine design. Engine conditioning sets the thermal state for reliable ignition.
4. Built-in holds: T-60 minutes (range verification), T-20 minutes (final weather check), T-10 minutes (go/no-go poll of all console positions), T-4 minutes (entering terminal count, autosequence start). Holds pause the countdown clock; operations that are time-sensitive (like cryogenic loading) continue during holds.
5. Scrub and recycle: if the countdown is stopped after propellant loading, the vehicle must be detanked (propellant drained and tanks safed). Detanking takes 2-6 hours. The turnaround to the next attempt depends on the scrub reason, propellant availability, and launch window. A 24-hour recycle is typical for weather scrubs.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
