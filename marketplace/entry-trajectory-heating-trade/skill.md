# Entry Trajectory Heating Trade

Design the entry trajectory to manage the trade between peak heating rate (drives TPS material selection) and total heat load (drives TPS thickness).

## Inputs

- `entry-conditions`: Entry velocity, entry flight path angle, vehicle ballistic coefficient (m/CdA)
- `vehicle-constraints`: Maximum deceleration (g-limit for crew or payload), landing accuracy requirement

## Outputs

- `trajectory-profile`: Altitude, velocity, and deceleration vs time
- `heating-profile`: Heat rate and integrated heat load vs time at key body points
- `tps-design-environments`: Peak heating rate and total heat load that drive TPS sizing

## Process

1. Calculate the Allen-Eggers ballistic entry solution: for a ballistic (non-lifting) entry at angle gamma, peak deceleration a_max = V_entry^2 * sin(gamma) / (2*e*H_s) where H_s is the atmospheric scale height. Peak heating rate q_max proportional to V_entry^3 * sqrt(rho). Steeper entries have higher peak heating but shorter duration (less total heat load). Shallower entries spread the heating over longer time (lower peak, higher total).
2. For lifting entry (L/D > 0), the vehicle can modulate bank angle to control the descent rate. A higher L/D allows more control over the trajectory: skip entry (bounce off the atmosphere to dissipate energy over multiple passes), direct entry with bank angle modulation for g-limiting, and guided entry for landing accuracy. Apollo used L/D ~ 0.3. Crew Dragon L/D ~ 0.2. Dream Chaser L/D ~ 1.5.
3. Calculate heating using Chapman's equation or the Sutton-Graves correlation along the trajectory. Stagnation heating: q_stag = K * sqrt(rho / R_n) * V^n where K and n depend on the atmosphere (Earth: n ~ 3 for moderate velocities, n ~ 8 for radiative heating at super-orbital). Integrate heating over the trajectory for total heat load at each body point.
4. Identify the design environments: stagnation point sees the highest heating rate (drives material selection). Leeward shoulder or expansion regions see lower heating but can have transition to turbulence with local heating spikes. Acreage (large flat areas) sees moderate heating but large total heat load due to area (drives total TPS mass). Windward centerline of a lifting body sees the highest acreage heating.
5. Trade trajectory shape against TPS mass: a steeper entry reduces total heat load (less TPS thickness needed) but increases peak heating rate (may require more capable material). An optimized trajectory minimizes TPS mass, not just heating.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
