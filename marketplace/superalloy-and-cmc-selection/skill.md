# Superalloy And Cmc Selection

Select the high-temperature material system for the application based on operating temperature, stress, environment, and life requirements.

## Inputs

- `operating-conditions`: Temperature range, stress state, oxidizing or reducing atmosphere, cyclic vs steady
- `life-requirement`: Required service hours and number of thermal cycles
- `component-function`: Structural, thermal protection, or wear resistance role

## Outputs

- `material-selection`: Selected material system with composition, form, and processing route
- `property-data`: Mechanical and thermal properties at operating temperature with design allowables
- `failure-mode-assessment`: Dominant failure mechanisms and inspection intervals

## Process

1. Map the temperature-stress space: below 850C, conventional steels and titanium alloys work. 850 to 1100C: nickel superalloys (Inconel 718 up to 650C, Waspaloy to 750C, single-crystal CMSX-4 or Rene N5 to 1100C with cooling). 1100 to 1600C: ceramic matrix composites (SiC/SiC) or coated superalloys. Above 1600C: ultra-high temperature ceramics (ZrB2-SiC, HfC) or actively cooled refractory metals.
2. For nickel superalloy selection: the gamma-prime (Ni3Al) precipitate fraction determines creep strength. Higher gamma-prime volume fraction (60 to 70% in single crystals) gives higher creep resistance but lower ductility and harder processing. Select alloy family by fabrication method: wrought (718, Waspaloy for disks), investment cast equiaxed (IN713 for vanes), directionally solidified (CM247LC), or single crystal (CMSX-4, CMSX-10 for the hottest blades).
3. For ceramic matrix composites: SiC fiber in SiC matrix (SiC/SiC) is the primary system for aerospace hot structures. Fiber types: Hi-Nicalon S (best high-temperature retention), Tyranno SA (alternative). Matrix deposited by CVI (chemical vapor infiltration: best properties but slow and expensive), PIP (polymer infiltration and pyrolysis: faster, lower density), or MI (melt infiltration: dense matrix but residual free silicon limits temperature to 1350C).
4. Evaluate failure mechanisms: for superalloys, creep rupture (Larson-Miller parameter for life prediction), thermal-mechanical fatigue (TMF: strain range and temperature phase drive crack initiation), oxidation and hot corrosion (type I sulfidation at 800 to 950C, type II below 800C). For CMCs, matrix cracking (proportional limit stress is the design driver, not ultimate strength), fiber creep at extreme temperatures, and environmental barrier degradation.
5. Specify design allowables: for metallic components, use minimum properties at the operating temperature from handbook data (MMPDS for metals). For CMCs, use a probabilistic approach (Weibull statistics) because ceramic materials have scatter in strength. Apply appropriate safety factors (1.5 on ultimate for metallic, 2.0 or higher for CMC in critical applications).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
