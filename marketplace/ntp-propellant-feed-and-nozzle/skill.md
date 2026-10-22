# Ntp Propellant Feed And Nozzle

Design the hydrogen feed system, turbopump, and nozzle for the NTP engine, including the bleed cycle that drives the turbomachinery.

## Inputs

- `core-geometry`: Core flow path, pressure drop, and outlet temperature
- `power-level`: Thermal power and hydrogen mass flow rate
- `thrust-requirement`: Required thrust and chamber pressure

## Outputs

- `feed-system-design`: Turbopump sizing, bleed cycle architecture, and valve sequence
- `nozzle-design`: Nozzle expansion ratio, throat size, and cooling approach
- `engine-performance`: Delivered Isp, thrust, and engine mass estimate

## Process

1. Design the engine cycle: NTP engines typically use a hot bleed cycle or expander cycle. In the bleed cycle, a small fraction (1 to 3%) of the hot hydrogen from the reactor is diverted to drive the turbine. In the expander cycle, hydrogen is heated in the nozzle and reflector cooling jacket before entering the turbine. The expander cycle is more efficient but power-limited at high thrust levels.
2. Size the turbopump: the pump must raise LH2 from tank pressure (20 to 40 psia) to chamber pressure (500 to 1000 psia) plus pressure drops through the cooling jacket, core, and plumbing. Head rise = delta_P / (rho_LH2 * g). LH2 density is only 70 kg/m^3, so volumetric flow rates are high. Inducer design is critical for cavitation suppression at the low inlet pressures.
3. Design the hydrogen flow path through the engine: LH2 from the pump first cools the nozzle (regeneratively), then flows through the reflector and pressure vessel (absorbing neutron and gamma heating), then enters the core fuel elements from the cold end, flowing through the narrow channels in each element to be heated to chamber temperature.
4. Size the nozzle: expansion ratio (A_exit/A_throat) from the altitude (vacuum operation: as large as packaging allows, typically 100:1 to 300:1). Throat area from A* = m_dot * sqrt(T_chamber) / (P_chamber * Gamma) where Gamma is a function of the specific heat ratio. For hydrogen at 2700K, gamma is approximately 1.35 (lower than ideal gas due to molecular vibration and dissociation).
5. Address nozzle cooling: the throat region sees the highest heat flux (~50 to 100 MW/m^2). Use regenerative cooling with the hydrogen fuel flowing through channels in the nozzle wall. Size the channel geometry from the heat flux, allowable wall temperature, and hydrogen heat transfer coefficient. Hydrogen is an excellent coolant but requires careful structural design for the high pressure.
6. Calculate delivered Isp: theoretical Isp from chamber temperature and molecular weight (Isp_vac = sqrt(2*gamma/(gamma-1) * R*T_c/M * (1-(p_e/p_c)^((gamma-1)/gamma))) / g). Subtract losses: divergence (1 to 2%), boundary layer (1 to 2%), chemical nonequilibrium (1%), bleed cycle loss (1 to 3%). Delivered Isp for NTP: 850 to 950 s, roughly double LOX/LH2 chemical engines.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
