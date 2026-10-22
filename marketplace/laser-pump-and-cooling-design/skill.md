# Laser Pump And Cooling Design

Design the pump source coupling and thermal management for reliable continuous operation at the target power level.

## Inputs

- `pump-requirements`: Pump wavelength, power, and absorption bandwidth
- `gain-medium-selection`: Gain medium and its thermal properties
- `resonator-layout`: Cavity geometry for pump delivery

## Outputs

- `pump-system-design`: Pump source, coupling optics, and delivery method
- `thermal-management-design`: Cooling method, flow rates, and temperature control spec
- `thermal-lens-estimate`: Expected thermal lens strength versus pump power

## Process

1. Select the pump source. Diode laser bars for solid-state lasers (wavelength-matched to absorption peak, e.g., 808nm for Nd:YAG, 940nm or 969nm for Yb:YAG). Fiber-coupled diodes for end-pumping. VCSELs for uniform side-pumping. Electrical discharge for gas lasers. Pump diode for fiber lasers (976nm for Yb-doped).
2. Design pump delivery. End-pumping gives good mode overlap but limits power (thermal fracture). Side-pumping scales to higher power but has poorer mode overlap. For fiber lasers, use cladding pumping with double-clad fiber (pump light in inner cladding, signal in core). Calculate absorbed pump power from Beer-Lambert law: P_abs = P_pump * (1 - exp(-alpha_pump * L)).
3. Calculate heat load. Quantum defect heating: P_heat = P_abs * (1 - lambda_pump/lambda_laser). For Nd:YAG pumped at 808nm lasing at 1064nm, quantum defect is 24%. Add non-radiative decay and upconversion heating. For Yb:YAG pumped at 969nm (zero-phonon line), quantum defect drops to 6%.
4. Size the cooling system. For conduction-cooled slabs: solve the 1D heat equation to find the temperature rise. For water-cooled rods: use Newton's law with the convective heat transfer coefficient. Target is to keep the gain medium below its thermal fracture limit (Nd:YAG thermal shock parameter R = 7.9 W/cm, for 5mm rod this limits pump to about 40W).
5. Calculate the thermal lens from the temperature gradient: f_th = pi * K * w_p^2 / (P_heat * dn/dT) for end-pumped, or f_th = K * A / (xi * Q * dn/dT) for uniformly heated rod. Feed this back into the resonator model to verify stability over the operating range.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
