# Srf Surface Treatment

Prepare the inner surface of a superconducting niobium cavity through chemical and thermal treatment to achieve target gradient and quality factor.

## Inputs

- `cavity-geometry`: Cavity shape and material (niobium grade)
- `rf-parameters`: Target gradient and Q0
- `hom-spectrum`: HOM spectrum and damping requirements

## Outputs

- `surface-recipe`: Complete surface treatment procedure
- `expected-performance`: Predicted Q0 vs Eacc curve
- `quality-control-plan`: Inspection and measurement at each process step

## Process

1. Start with bulk niobium: RRR > 300 (high purity, low interstitial content). Receive inspection: eddy current scanning for defects, RRR sample measurement. Form half-cells by deep drawing or spinning, electron-beam weld to full cavity under vacuum.
2. Bulk material removal: buffered chemical polish (BCP: HF + HNO3 + H3PO4, ratio 1:1:2) removes ~150um to eliminate weld damage layer. Or electropolish (EP: HF + H2SO4) for smoother surface (Ra < 0.5 um). EP gives higher gradient ceiling by eliminating sharp features that enhance field emission.
3. Nitrogen doping (for high Q0): after EP, furnace treatment at 800C in nitrogen atmosphere (partial pressure ~25 mTorr, 2-20 min duration), followed by light EP removal of 5-10 um. Nitrogen in interstitial sites increases Q0 by factor 2-3 at medium gradients by suppressing BCS resistance through mean free path optimization.
4. High-pressure rinse: 100 bar ultrapure water (>18 MOhm-cm) rinsing in ISO 4 cleanroom to remove particulate contamination that causes field emission. Multiple rinse cycles. Assemble cavity hardware (flanges, coupler ports) in cleanroom.
5. Bakeout: 120C for 48 hours (low-temperature bake) to reduce high-field Q-slope by modifying the oxide layer and near-surface interstitials. Or 300C/3h mid-T bake (emerging alternative to N-doping for high Q0 and high gradient simultaneously). Each recipe has a specific Q0 vs Eacc signature.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
