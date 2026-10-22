# Solar Cell Physics And Selection

Select the solar cell technology based on efficiency, cost, temperature coefficient, and degradation characteristics for the target application.

## Inputs

- `system-requirements`: Target system size (kW or MW), site location (latitude, irradiance, temperature profile), application (rooftop, ground-mount, BIPV, portable), budget range
- `performance-targets`: Minimum module efficiency, temperature coefficient tolerance, warranty requirements (years), aesthetic constraints

## Outputs

- `cell-technology-selection`: Cell type (mono-PERC, TOPCon, HJT, IBC, CdTe, CIGS, perovskite tandem), rated efficiency, temperature coefficient of Pmax (typically -0.3 to -0.45 %/K for Si), bifaciality factor, expected degradation rate (%/year)
- `cell-electrical-model`: Single-diode model parameters: I_L (photocurrent), I_0 (saturation current), n (ideality factor), R_s (series resistance), R_sh (shunt resistance), and their temperature and irradiance dependencies

## Process

1. The Shockley-Queisser limit sets the theoretical maximum efficiency for a single-junction cell: 33.7% for a 1.34 eV bandgap under AM1.5G. Silicon (1.12 eV): SQ limit = 32.3%. Current commercial efficiencies: mono-PERC 22-23%, TOPCon 24-25%, HJT (heterojunction) 24-26%, IBC (interdigitated back contact) 25-26%. Tandem (perovskite on Si): lab records above 33%.
2. PERC (Passivated Emitter and Rear Cell): standard technology, lowest cost. Rear passivation reduces recombination at the back surface, adding 1-2% absolute efficiency over Al-BSF. Temperature coefficient: -0.35 to -0.40 %/K.
3. TOPCon (Tunnel Oxide Passivated Contact): thin tunnel oxide + doped poly-Si on the rear. Lower surface recombination velocity than PERC. Higher Voc (710-720mV vs 680-690mV for PERC). Temperature coefficient: -0.30 to -0.35 %/K (better than PERC due to higher Voc).
4. HJT: amorphous Si passivation on both surfaces of a thin (120-150um) n-type wafer. Excellent passivation (Voc > 730mV). Symmetric structure enables high bifaciality (>90%). Temperature coefficient: -0.25 to -0.30 %/K (best among commercial Si). No LID (light-induced degradation) because n-type base. Higher manufacturing cost from ITO sputtering and low-temperature processing requirement.
5. Extract the single-diode model parameters from the I-V curve data sheet: I_sc, V_oc, I_mp, V_mp at STC (1000 W/m^2, 25C, AM1.5G). The five parameters (I_L, I_0, n, R_s, R_sh) are determined by fitting the diode equation: I = I_L - I_0*(exp((V+I*Rs)/(n*Vt)) - 1) - (V+I*Rs)/R_sh where Vt = kT/q. Use the Lambert-W function for the explicit solution, or Newton-Raphson iteration.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
