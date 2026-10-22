# Turbulence Flow Regime Screening

Screen the flow physics that decide which turbulence approach can succeed, because the dominant features (separation, pressure gradient, transition, unsteadiness) rule methods in or out before any grid is built.

## Inputs

- `flow-configuration`: The geometry, boundary conditions, and operating point of the flow to be simulated
- `accuracy-and-output-needs`: What the simulation must predict (forces, heat transfer, noise, mixing) and to what accuracy

## Outputs

- `flow-regime-profile`: The Reynolds number, expected separation, pressure-gradient character, transition, and unsteadiness of the flow
- `modeling-requirements`: Which physics the turbulence approach must capture to meet the output needs

## Process

1. Compute the Reynolds number and locate the flow on the laminar-transitional-turbulent map. Re = rho*U*L/mu sets the range of scales; pipe flow transitions near Re about 2300, a flat-plate boundary layer near Re_x about 5e5, and high-Re external aerodynamics is fully turbulent with a wide scale separation that forbids resolving all scales.
2. Identify whether the flow separates and under what pressure gradient. Attached boundary layers with mild gradients are forgiving; adverse pressure gradients and separation (diffusers, airfoils past stall, bluff bodies) are where simple closures fail, because the equilibrium assumptions behind wall functions and the eddy-viscosity closures break down.
3. Decide whether transition matters. If a laminar run of boundary layer precedes turbulence (low-Re airfoils, turbine blades, small drones), fully turbulent models will mispredict drag and heat transfer; the output may require a transition-sensitive model rather than a fully turbulent one.
4. Judge whether the quantity of interest needs the unsteady turbulent structures themselves. Mean forces and heat transfer on attached flows are often well predicted by a steady averaged model; aeroacoustic noise, buffeting, combustion mixing, and massively separated wakes need the resolved unsteady eddies that only a scale-resolving method provides.
5. Translate the physics into modeling requirements. Write down what the approach must capture (near-wall gradients for heat transfer, separation onset for stall, resolved spectra for noise) so the next step chooses a method that meets the requirements rather than defaulting to a familiar one.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
