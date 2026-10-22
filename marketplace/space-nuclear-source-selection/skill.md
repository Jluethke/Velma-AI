# Space Nuclear Source Selection

Select the nuclear power source type (radioisotope vs fission reactor) based on mission power level, duration, and mass constraints.

## Inputs

- `power-requirement`: Electrical power needed (watts to kilowatts to megawatts) and whether continuous or pulsed
- `mission-duration`: Required operating life (years to decades)
- `mass-and-volume-constraints`: Allowable mass and volume for the power system

## Outputs

- `source-type-selection`: RTG, Stirling, or fission reactor with justification
- `system-architecture`: Power source, conversion, and heat rejection configuration
- `mass-power-trade`: Specific power (W/kg) and how it scales with power level

## Process

1. Map power level to source type: below about 500 W electrical, radioisotope systems dominate (RTG or Stirling). 500 W to 10 kW: either large radioisotope arrays or small fission reactors compete (crossover depends on mission duration and launch mass sensitivity). Above 10 kW: fission reactors are the only practical nuclear option. Above 100 kW: fission reactors with dynamic conversion (Brayton, Rankine).
2. For radioisotope sources: Pu-238 is the standard isotope (87.7-year half-life, alpha emitter, low radiation shielding needed, 0.56 W/g thermal at beginning of life). The fuel form is PuO2 pressed into pellets encased in iridium clad and graphite impact shells (GPHS module: 250 W thermal per module, designed to survive launch abort reentry and impact). Power degrades at 0.8% per year from half-life.
3. RTG conversion: thermoelectric couples (SiGe or PbTe/TAGS) convert thermal to electrical at 6 to 7% efficiency. MMRTG (Mars missions): 110 W electrical at BOL from 2000 W thermal (8 GPHS modules). Specific power: about 2.8 W/kg. No moving parts, proven reliability (Voyager RTGs operating since 1977). Stirling conversion: 25 to 30% efficiency, so the same thermal source produces 3 to 4x more electrical power, but has moving parts (piston) with associated reliability concern.
4. For fission systems: the reactor produces thermal power from U-235 fission. At 10 kW electrical, a small reactor (KRUSTY/Kilopower heritage: 43 kg U-235 core, heat pipe cooled, Stirling conversion) provides about 10 kW at ~28% conversion efficiency. Specific power: about 5 to 10 W/kg at 10 kW class. At 100 kW+: reactor with Brayton cycle gas turbine or Rankine liquid metal cycle. Specific power improves with scale (15 to 40 W/kg at 100 kW class).
5. Design the heat rejection system: all space power systems must reject waste heat by radiation (no convection in vacuum). Radiator area = Q_reject / (epsilon * sigma * T_radiator^4). Higher rejection temperature means smaller radiator but lower conversion efficiency. For thermoelectric at ~525K fin temperature: 50 to 100 m^2/kW of rejection. For Stirling at ~375K: larger radiator needed. For Brayton at ~500K: moderate. Radiator mass often dominates the system mass at high power levels.
6. Estimate system mass: reactor + shield + conversion + radiator + structure. The radiation shield (to protect spacecraft electronics and payload) is often the heaviest single component. Shadow shield design: place the reactor at one end of a boom, shield only the cone angle subtended by the spacecraft (saves mass compared to 4-pi shielding). Shield materials: LiH for neutrons, tungsten or depleted uranium for gamma.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
