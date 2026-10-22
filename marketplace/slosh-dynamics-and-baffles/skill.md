# Slosh Dynamics And Baffles

Analyze propellant slosh dynamics and design baffles to prevent control system coupling.

## Inputs

- `tank-dimensions`: Tank diameter and length
- `control-law-design`: Vehicle control system bandwidth and stability margins
- `trajectory-design`: Acceleration profile during flight

## Outputs

- `slosh-frequency-vs-fill`: First and second slosh mode frequencies as a function of fill level
- `slosh-mass-fraction`: Fraction of propellant mass that participates in sloshing
- `baffle-design`: Baffle type, location, and open area specification
- `control-interaction-assessment`: Phase and gain margins with slosh included in the control loop

## Process

1. First-mode slosh frequency in a cylindrical tank under axial acceleration: f = (1/2*pi) * sqrt(g_eff * (pi/D) * tanh(pi*h/D)), where g_eff is the effective axial acceleration (thrust/mass), D is tank diameter, and h is liquid depth. As the tank empties, h decreases and the slosh frequency changes.
2. The mechanical analogy: the sloshing propellant is modeled as a pendulum mass (first mode) connected to the tank by a spring and damper. The pendulum mass (slosh mass) is a fraction of the total propellant mass, typically 10-50% depending on fill level. The rest of the propellant moves rigidly with the tank (frozen mass).
3. Control coupling: if the slosh frequency is close to the vehicle control bandwidth, the control system can excite the slosh, causing growing oscillations. The phase between vehicle lateral motion and slosh force can be destabilizing. The control system designer needs the slosh model to verify stability.
4. Baffle design: ring baffles (annular plates attached to the tank wall) are the standard approach. They dissipate slosh energy through viscous damping as the liquid flows through the baffle holes and around the baffle edges. The damping ratio provided by a ring baffle is approximately proportional to the baffle immersion depth and inversely proportional to the baffle spacing.
5. Baffle placement: install baffles where the first-mode slosh amplitude is highest (at the liquid free surface for most fill levels). Typically 3-8 baffles in the cylindrical section of the tank. The baffle must have holes or slots (20-40% open area) to allow propellant flow during draining. Solid baffles trap propellant and are not used.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
