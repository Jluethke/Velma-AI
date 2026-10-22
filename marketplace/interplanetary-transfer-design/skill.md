# Interplanetary Transfer Design

Design interplanetary transfer trajectories using patched conics, pork chop plots, gravity assists, and three-body dynamics for lunar and planetary missions.

## Inputs

- `rendezvous-sequence`: Near-Earth rendezvous capability if assembly required
- `safety-analysis`: Departure orbit safety constraints

## Outputs

- `interplanetary-trajectory`: Complete trajectory design with departure date, arrival date, delta-v at each maneuver, and flyby parameters
- `launch-window-analysis`: Pork chop plot showing delta-v contours vs departure and arrival dates, optimal and backup windows

## Process

1. Generate the pork chop plot. For a grid of departure dates and arrival dates spanning the synodic period, solve Lambert's problem to find the transfer orbit. For each (departure, arrival) pair, compute the departure excess velocity v_infinity and the arrival excess velocity. Plot C3 = v_infinity^2 contours.
2. Apply the patched conic method. Divide the trajectory into heliocentric and planetocentric segments. At Earth departure, the hyperbolic excess velocity determines the required injection delta-v from the parking orbit: delta_v = sqrt(v_infinity^2 + 2*mu_Earth/r_park) - v_circular. At arrival, compute the capture delta-v similarly.
3. Evaluate gravity assist opportunities. A flyby at a planet changes the heliocentric velocity by rotating the v_infinity vector by the turn angle delta = 2*arcsin(1/(1 + r_p*v_infinity^2/mu_planet)). The energy change depends on the flyby geometry. Sequence multiple flybys (e.g., Venus-Earth-Earth for outer planet missions) to reduce total delta-v.
4. For lunar missions, use three-body dynamics. The Earth-Moon L1 and L2 points provide low-energy transfer paths. A weak stability boundary transfer can reduce delta-v by 10-15% compared to a Hohmann-like direct transfer, at the cost of 2-3 months additional transit time. The ballistic capture approach exploits the Sun's gravitational perturbation.
5. Perform trajectory correction maneuver budgeting. Injection errors from the launch vehicle produce trajectory dispersions that grow with time. Size the TCM delta-v budget from 3-sigma injection errors and the trajectory sensitivity matrix. Plan TCM timing: TCM-1 typically at departure plus 1-2 days (largest correction), TCM-2 at midcourse, and final targeting TCMs near arrival.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
