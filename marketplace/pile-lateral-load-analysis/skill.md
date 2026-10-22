# Pile Lateral Load Analysis

Analyze pile response to lateral loads using p-y curve or equivalent methods.

## Inputs

- `structural-loads`: Lateral loads and moments at pile head from structural analysis
- `ground-conditions`: Soil properties for lateral analysis (su, phi', subgrade modulus by depth)

## Outputs

- `lateral-response`: Pile head deflection, maximum bending moment and its depth, and shear force profile
- `structural-demand`: Required pile section for combined axial and lateral loading

## Process

1. Select analysis method. P-y curve method: nonlinear springs along pile length representing soil resistance. Standard p-y curves: soft clay (Matlock 1970), stiff clay (Reese et al. 1975), sand (Reese et al. 1974, API 2000). P-y curves define ultimate lateral resistance and load-deflection shape as function of depth, soil properties, and pile diameter.
2. Build p-y model. Discretize pile into segments (0.25 to 0.5 m spacing). Assign p-y curves based on soil type at each depth. Pile properties: EI (may be cracked section for concrete piles), length. Boundary conditions at head: free (moment = applied moment, shear = applied lateral load) or fixed (rotation = 0 for pile cap connection). Solve iteratively (nonlinear springs require iteration to converge).
3. Check results. Pile head deflection: typically limited to 6 to 25 mm depending on structure tolerance. Maximum bending moment: occurs at 3 to 8 pile diameters below ground surface in most soils. Compare to pile structural capacity (Mn for concrete, Mp for steel). Shear force profile: check maximum shear against structural capacity.
4. For pile groups: group reduction factors (p-multipliers) from Reese and Van Impe or Brown et al. Leading row: p-multiplier = 0.8 to 1.0. Second row: 0.4 to 0.7. Third and subsequent rows: 0.3 to 0.6. Depends on pile spacing (greater reduction at closer spacing, typically S/D < 5). Apply p-multipliers to p-y curves for each row and analyze the group.
5. Combined loading check. For reinforced concrete piles: construct M-N interaction diagram including pile self-weight. Check that (M, N) at every depth lies within the interaction surface. For steel piles: combined stress check per AISC (Pu/Pn + Mu/Mn <= 1.0 for small axial, bilinear interaction for larger). If pile section is insufficient, increase pile size or add piles to reduce per-pile demand.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
