# Hypersonic Surface Heating Prediction

Calculate convective and radiative heating rates on the vehicle surface for both laminar and turbulent boundary layers, including real gas effects.

## Inputs

- `post-shock-state`: Thermodynamic state behind the shock
- `transition-location-map`: Where the boundary layer transitions from laminar to turbulent
- `vehicle-geometry`: Surface geometry and nose radius
- `flight-conditions`: Mach, altitude, velocity

## Outputs

- `heating-rate-map`: Convective and radiative heating rate (W/m^2) at each surface station for laminar and turbulent cases
- `stagnation-heating`: Peak stagnation point heating rate and integrated heat load
- `real-gas-corrections`: Correction factors for dissociation, catalytic wall effects, and surface chemistry

## Process

1. Calculate stagnation point heating using the Fay-Riddell equation: q_s = 0.763 * Pr^(-0.6) * (rho_w * mu_w)^0.1 * (rho_e * mu_e)^0.4 * (h_e - h_w) * sqrt(du_e/dx). For quick estimates, use Sutton-Graves: q_s = K * sqrt(rho_inf / R_n) * V^3 where K depends on gas composition (K = 1.7415e-4 for air in SI).
2. For laminar flat plate regions, apply the reference enthalpy method: compute reference temperature T* = T_e + 0.5*(T_w - T_e) + 0.22*(T_r - T_e), evaluate transport properties at T*, then use Cf = 0.664/sqrt(Re_x*) and q = 0.5 * Cf * rho* * V_e * (h_aw - h_w).
3. For turbulent regions, use the Van Driest II correlation with reference enthalpy: Cf = 0.0592 / Re_x*^0.2, noting that turbulent heating is typically 3 to 8 times laminar heating depending on Reynolds number.
4. Apply real gas corrections: at temperatures above 2500K, O2 dissociates; above 4000K, N2 dissociates. This absorbs energy in the shock layer, reducing the temperature below ideal gas predictions. Catalytic wall effects: a fully catalytic wall recovers the dissociation energy at the surface (higher heating); a non-catalytic wall does not (lower heating). The wall catalycity is material-dependent.
5. Estimate radiative heating for velocities above about 10 km/s (reentry from lunar or Mars return). Use Tauber-Sutton correlation: q_rad = C * R_n^a * rho^b * f(V) where C, a, b depend on the radiating species. Radiative heating can dominate at super-orbital velocities.
6. Integrate heating rate over the trajectory timeline to get total heat load (J/m^2) at each station, which drives TPS thickness sizing.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
