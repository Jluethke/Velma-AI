# Wind Turbine Aerodynamic Design

Design the wind turbine rotor using blade element momentum (BEM) theory: airfoil selection, blade chord and twist distribution, and performance optimization.

## Inputs

- `wind-resource-characterization`: Wind speed distribution and turbulence for performance optimization
- `site-wind-parameters`: IEC class and extreme wind for structural input

## Outputs

- `rotor-design`: Blade geometry (chord and twist vs span), airfoil distribution, design tip speed ratio, and rated/cut-in/cut-out wind speeds
- `power-curve`: Predicted power output vs wind speed from cut-in to cut-out, with Cp curve vs tip speed ratio

## Process

1. Select the design tip speed ratio (TSR). Optimal TSR for a three-bladed horizontal axis turbine is 6-8. Higher TSR means narrower chord (less material) but higher tip speeds (more noise and leading-edge erosion). The tip speed limit for onshore turbines is typically 80-85 m/s for noise compliance; offshore can go higher.
2. Apply BEM theory to determine the optimal chord and twist distribution. At each radial station, calculate the induction factors (axial a and tangential a-prime) that maximize the local power coefficient. The Glauert correction applies for high induction (a greater than 0.4). Prandtl's tip loss factor corrects for finite blade effects near the tip and root.
3. Select airfoils along the span. Thick airfoils (24-40% thickness) at the root for structural strength, transitioning to thin airfoils (15-21%) at the tip for aerodynamic efficiency. The DU and NACA 63-series are common. Roughness insensitivity matters for leading-edge contamination from insects and erosion. Flatback airfoils at the root improve Cl at high thickness ratios.
4. Optimize the blade for the annual energy production (AEP), not just peak Cp. The blade operates across a range of wind speeds with variable pitch and speed control. Below rated wind speed, the controller varies rotor speed to maintain optimal TSR. Above rated, pitch control limits power to rated. The optimization trades peak Cp against performance breadth across the wind speed distribution.
5. Generate the predicted power curve. At each wind speed, calculate the power from BEM including mechanical and electrical losses (gearbox if present, generator, converter, transformer). Apply air density corrections for the site altitude and temperature. The gap between the theoretical and measured power curve (typically 2-5%) accounts for yaw misalignment, turbulence effects, and control system imperfections.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
