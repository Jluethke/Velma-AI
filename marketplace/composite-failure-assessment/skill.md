# Composite Failure Assessment

Evaluate laminate strength using multiple failure criteria and identify the first-ply-failure and last-ply-failure loads with appropriate knockdown factors.

## Inputs

- `ply-stress-distribution`: Stress in each ply in material coordinates from the laminate analysis
- `material-allowables`: Ply-level strength values (Xt, Xc, Yt, Yc, S) at the design condition (temperature, moisture, basis values: A-basis or B-basis per MIL-HDBK-5/CMH-17)

## Outputs

- `failure-envelope`: Margin of safety for each ply under each failure criterion, identifying the critical ply and failure mode
- `design-knockdowns`: Applied knockdown factors for environment (hot-wet), damage tolerance (BVID), fatigue, and manufacturing variability with the resulting allowable strain levels

## Process

1. Apply the Tsai-Wu failure criterion to each ply: F1*sigma_1 + F2*sigma_2 + F11*sigma_1^2 + F22*sigma_2^2 + F66*tau_12^2 + 2*F12*sigma_1*sigma_2 < 1. The interaction term F12 is typically set to -0.5*sqrt(F11*F22) unless biaxial test data is available.
2. Cross-check with the maximum strain criterion and the Hashin criterion. Max strain catches simple fiber failure that Tsai-Wu may mask. Hashin separates fiber failure from matrix failure modes, which matters for progressive damage analysis and fatigue.
3. Apply environmental knockdowns. Hot-wet compression strength is typically 60-80% of room temperature dry for carbon/epoxy systems. Pull the specific knockdown from the material qualification database, not a generic value.
4. Apply the open-hole compression (OHC) or compression-after-impact (CAI) knockdown for damage tolerance. For aerospace primary structure, the design strain is typically limited to 4500-5000 microstrain in compression after a barely visible impact damage (BVID, typically 50 ft-lb impact energy for thin skins).
5. Calculate the margin of safety: MS = (allowable / applied) - 1. Report the minimum MS across all plies, all criteria, all load cases. If MS < 0 on any combination, return to laminate definition and increase ply count or adjust orientations.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
