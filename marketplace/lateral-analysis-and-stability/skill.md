# Lateral Analysis And Stability

Perform unbalance response analysis and stability assessment for the rotor system across the operating speed range.

## Inputs

- `lateral-model`: Rotor-bearing model for lateral dynamics
- `critical-speed-map`: Critical speeds vs bearing stiffness
- `operating-conditions`: Speed range and API/ISO requirements

## Outputs

- `unbalance-response`: Amplitude and phase of rotor vibration at bearings and seals vs speed for specified unbalance distributions
- `separation-margin`: Margin between critical speeds and operating speed range per API 617 or applicable standard
- `stability-assessment`: Logarithmic decrement of each mode, identifying potentially unstable modes and their destabilizing mechanisms

## Process

1. Identify undamped critical speeds from the eigenvalue analysis. Per API 617: the first critical speed must be at least 15% below minimum continuous speed, or the first critical speed must be at least 20% above maximum continuous speed (separation margin). Trip speed and transient speeds must also clear critical speeds.
2. Perform unbalance response analysis. Apply unbalance at locations per API (midspan for first mode excitation, at coupling overhang for second mode). Use 4 times the allowable residual unbalance (4W/N) as the analysis unbalance where W is journal static load and N is maximum continuous speed in RPM. Calculate vibration amplitude at bearings and seal locations across the speed range.
3. Check vibration amplitude against limits: API 617 limits bearing vibration to 25.4 micrometers or sqrt(12000/N) in mils pk-pk, whichever is less, at maximum continuous speed. At critical speed traversal, the amplification factor (peak amplitude / amplitude at critical speed x sqrt(2)) defines the damped critical speed sharpness.
4. Assess stability: compute the damped eigenvalues (complex). The real part indicates stability: negative real part is stable. Express as log decrement delta = -2*pi*sigma/omega_d. API 617 requires delta > 0.1 for Level I analysis. If a mode has low log decrement, identify the destabilizing mechanism: cross-coupled stiffness from oil film bearings, labyrinth seals, or aerodynamic forces.
5. If stability is marginal: consider design changes. Tilting-pad bearings reduce cross-coupled stiffness compared to fixed-bore journal bearings. Squeeze-film dampers add direct damping. Swirl brakes or shunt holes in labyrinth seals reduce aerodynamic cross-coupling.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
