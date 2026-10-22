# Natural Frequency Estimation

Estimate the natural frequencies of the PCB and critical components using analytical methods before FEA, to develop physical intuition about the dynamic behavior.

## Inputs

- `vibration-specification`: Vibration PSD and frequency range
- `assembly-description`: PCB and component physical details

## Outputs

- `pcb-natural-frequencies`: First three natural frequencies of the PCB for each mounting configuration, calculated analytically
- `component-risk-assessment`: Components at risk based on their location relative to maximum deflection zones and their mass contribution to local dynamics

## Process

1. Calculate the PCB first natural frequency using the Steinberg formula: fn = pi/(2*a^2) * sqrt(D / (rho*h)) for a simply supported plate, where D = E*h^3 / (12*(1-v^2)) is the flexural rigidity, a is the longer span, h is the total thickness, rho is the density including component mass. For FR4: E is approximately 18 GPa in-plane, v = 0.15, rho = 1850 kg/m^3 for bare board.
2. Adjust for boundary conditions. Simply supported edges give the lowest frequency. Clamped (bolted) edges approximately double the frequency. Practical screw mounting is between these extremes. Use a factor of 1.5 times the simply-supported value for bolted card guides.
3. Account for added mass from components. For uniform mass addition: fn_loaded = fn_bare * sqrt(m_bare / (m_bare + m_components)). For heavy point masses (connectors, transformers): the local deflection increases and the natural frequency drops. A 50g component at the center of a board can reduce fn by 30-40%.
4. Identify the maximum deflection zones. For a simply-supported plate, maximum deflection is at the center. Components at maximum deflection experience the highest acceleration and stress. The 3-sigma deflection under random vibration is: delta_3sigma = 3 * sqrt(pi * fn * Q * PSD_at_fn / (2)) * (m * g / k) where Q is the quality factor (typically 10-25 for PCBs).
5. Flag any component whose natural frequency (on its leads, relative to the board) falls within the excitation bandwidth. A tall electrolytic capacitor on wire leads might have a lead resonance at 200-500 Hz. Staking, brackets, or lead shortening may be needed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
