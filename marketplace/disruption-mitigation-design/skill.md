# Disruption Mitigation Design

Design the disruption prediction, avoidance, and mitigation systems to protect the machine from the electromagnetic and thermal loads of uncontrolled plasma terminations.

## Inputs

- `heating-system-design`: Heating system specifications
- `fueling-system-design`: Fueling approach
- `plasma-control-architecture`: Real-time control framework

## Outputs

- `disruption-mitigation-system`: Prediction algorithms, massive gas injection, and shattered pellet injection specifications
- `machine-protection-design`: Structural design for halo current loads, runaway electron mitigation, and wall armor for thermal quench

## Process

1. Characterize disruption loads: thermal quench deposits 80-100% of thermal energy (100s of MJ) on the wall in 1-3 ms. Current quench induces halo currents (up to 40% of Ip) and eddy currents with forces of MN on structures. Runaway electrons carry up to 70% of pre-disruption current with energies to 20 MeV.
2. Design disruption prediction: train classifiers on plasma parameters (locked mode amplitude, radiated power fraction, internal inductance, q95 proximity to rational surfaces). Target >95% detection with >30 ms warning time and <5% false positive rate.
3. Design massive material injection: shattered pellet injection (SPI) delivers neon or argon ice fragments to radiatively dissipate thermal energy uniformly before it concentrates on the wall. Size the pellet for assimilation fraction and target radiated power fraction >90%.
4. Design runaway electron mitigation: high-Z massive injection increases collisional drag and radiation losses. Resonant magnetic perturbation coils can deconfine runaways. Dedicated RE dumps may be needed as sacrificial armor.
5. Design structural response: first wall panels and vacuum vessel must survive worst-case halo current forces. Conduct eddy current analysis with time-varying fields from the current quench. Toroidal peaking factor for halo currents is typically 2.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
