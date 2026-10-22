# Propellant Selection Trade

Compare propellant combinations on Isp, density impulse, handling, manufacturing impact, and total vehicle cost for the mission.

## Inputs

- `mission-delta-v-budget`: Total delta-v requirements from mission design
- `stage-count`: Number of stages in the vehicle
- `reusability-requirement`: Whether the stage must be reusable (affects coking, thermal cycling, inspection needs)

## Outputs

- `propellant-recommendation`: Selected propellant combination with quantified rationale
- `propellant-comparison-matrix`: Comparison of candidates across all evaluation criteria
- `vehicle-sizing-impact`: How each propellant choice changes stage size, mass, and cost

## Process

1. LOX/RP-1: Vacuum Isp 310-340s, density impulse around 350 kg*s/L. Kerosene is storable at room temperature, cheap, and well-characterized. RP-1 cokes (deposits carbon) on hot walls above 500K, which limits regenerative cooling channel temperature and complicates reuse. This is the default for first stages.
2. LOX/LH2: Vacuum Isp 440-460s, density impulse around 120 kg*s/L. The highest chemical Isp available. But hydrogen is cryogenic (20K), extremely low density (requiring enormous tanks), and leaks through everything. Tank insulation mass partially offsets the Isp advantage. This is the default for upper stages and is used on Delta IV first stage.
3. LOX/LCH4: Vacuum Isp 350-370s, density impulse around 260 kg*s/L. Methane is between RP-1 and H2 in performance and handling. It does not coke, simplifying reuse. It can be manufactured on Mars from CO2 + H2O. Chosen by SpaceX (Raptor), Blue Origin (BE-4), and ULA (Vulcan upper stage). The emerging default.
4. Storable (N2O4/UDMH or MMH): Vacuum Isp 300-320s. Hypergolic (ignites on contact). No cryogenic ground support needed. Extremely toxic. Used for upper stages and spacecraft propulsion where restart reliability and simplicity outweigh performance. Not used for first stages on modern Western launchers.
5. The trade is NOT just Isp. A 10% density impulse advantage reduces tank volume, which reduces structural mass, which compounds through the rocket equation. For first stages, LOX/RP-1 or LOX/CH4 often beats LOX/LH2 at the vehicle level despite 100s lower Isp, because the tanks are so much smaller.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
