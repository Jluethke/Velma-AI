# Coupling Time Step Synchronization

Synchronize the time integration of fields that each have their own stability limit, using subcycling and a coupling time step that preserves accuracy and stability across the interface.

## Inputs

- `solution-strategy`: Whether coupling is loose or strong, which sets how often fields synchronize
- `coupling-residual-criterion`: The per-step convergence target the time stepping must honor

## Outputs

- `time-step-plan`: The coupling time step and any per-field subcycling ratios with their stability basis
- `stability-verification`: The check that confirms the coupled integration is stable and time-accurate

## Process

1. Compute each field stability limit separately. An explicit flow solver obeys a CFL condition dt <= C*h/(|u| + c) with Courant number C of order 1, where c is the sound speed for compressible flow; an explicit structural solver obeys dt <= L_min/c_structural set by the smallest element and the material wave speed. These limits can differ by orders of magnitude.
2. Choose the coupling time step as the interval at which fields exchange data. For a time-accurate coupled transient it is bounded by the physics you must resolve (for example the structural vibration period divided by 20 or more), and it must be no larger than the accuracy of the loosest field allows.
3. Use subcycling when field limits differ widely. Let the field with the small stable step advance several internal substeps per coupling step while the slower field takes one, and interpolate the interface data across the substeps. This keeps each solver stable without forcing the whole simulation onto the smallest step everywhere.
4. Keep loose coupling time-lagged honestly. A loose (explicit) scheme exchanges once per coupling step and is first-order in the coupling and can lose stability for tight problems; if accuracy or stability suffers, move to strong coupling with sub-iteration (the previous step) rather than shrinking dt indefinitely.
5. Verify stability and time accuracy with a refinement check. Halve the coupling time step and confirm the coupled response (interface displacement history, transferred force) changes by less than the target tolerance; a response that keeps changing or grows unbounded indicates the coupling scheme, not the step, needs strengthening.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
