# Launch Window Orbital Analysis

Determine launch windows from orbital mechanics constraints: target orbit, rendezvous phasing, lighting conditions, and range safety.

## Inputs

- `target-orbit`: Target orbit parameters including RAAN if relevant
- `launch-site`: Launch site location
- `mission-delta-v-budget`: Delta-v budget (excess capacity determines window width)

## Outputs

- `launch-window-schedule`: Available launch times with duration and delta-v cost for each
- `plane-change-cost`: Delta-v penalty for off-nominal launch times within the window
- `range-safety-constraints`: Azimuth limits from launch site that constrain achievable orbits

## Process

1. For a specific RAAN (right ascension of ascending node), the launch time is fixed by the Earth's rotation: the launch site must rotate under the target orbital plane. The instantaneous launch window for ISS rendezvous is about 5 minutes.
2. For sun-synchronous orbits, the RAAN must precess to maintain the sun angle. The required RAAN determines the launch time to within minutes. The inclination and altitude are coupled through J2 perturbation.
3. Range safety imposes azimuth limits (no flying over populated areas). Cape Canaveral launches east (37-112 degrees azimuth), limiting inclinations to 28.5-57 degrees without dog-leg. Polar and SSO orbits launch from Vandenberg.
4. For rendezvous missions, the phasing angle between the launch site and the target determines the launch instant. Coplanar launch eliminates the need for a plane change (very expensive at orbital velocity). The window repeats each time the target ground track passes over the launch site.
5. Compute the delta-v cost of launching at off-nominal times within the window. A wider window trades payload capacity for scheduling flexibility. Some missions carry margin specifically for window expansion.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
