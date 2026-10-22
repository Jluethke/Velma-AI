# Virtual Screening Hit Finding

Screen large compound libraries computationally to identify initial hits for a validated target. Structure-based virtual screening uses molecular docking (AutoDock Vina, Glide) to predict binding poses and estimate binding affinity. Ligand-based screening uses pharmacophore models or molecular fingerprint similarity to known actives. Combine approaches for higher hit rates.

## Inputs

- `target-structure`: 3D structure of the target protein with defined binding site
- `compound-library`: Chemical library to screen (ZINC, Enamine REAL, in-house collection)

## Outputs

- `hit-list`: Ranked compounds with predicted binding poses, docking scores, and chemical properties
- `screening-statistics`: Library size, compounds passing each filter, score distributions, enrichment over random

## Process

1. Prepare the target structure: add hydrogens at physiological pH (7.4), assign partial charges (AM1-BCC or RESP), define the binding site grid from co-crystallized ligand position or pocket detection. Remove water molecules except those making critical bridging interactions (conserved across multiple crystal structures).
2. Pre-filter the compound library: apply drug-likeness filters (Lipinski rule of five: MW < 500, LogP < 5, HBD <= 5, HBA <= 10; or extended Veber rules: PSA < 140, rotatable bonds <= 10). Remove reactive functional groups (PAINS: pan-assay interference compounds, BMS filters). This reduces library size by 20-40% and eliminates frequent false positives.
3. For structure-based screening, dock with AutoDock Vina or Glide (SP mode for initial screen, XP mode for top hits). Vina uses a scoring function combining gauss (steric), repulsion, hydrogen bonding, hydrophobic, and rotational entropy terms. Screen in batches: dock the full filtered library, rank by score, select top 1-5% for detailed analysis.
4. For ligand-based screening (when actives are known): generate pharmacophore model from aligned active compounds (shared features: hydrogen bond donors/acceptors, hydrophobic centers, aromatic rings, positive/negative ionizable). Screen library for pharmacophore matches. Alternatively, calculate Morgan fingerprints (ECFP4) for all compounds and rank by Tanimoto similarity to known actives (threshold > 0.3 for scaffold-hopping, > 0.6 for analogs).
5. Consensus scoring: combine structure-based and ligand-based rankings. Compounds scoring well in both approaches are enriched for true actives. Calculate enrichment factor: (hits in top N%) / (expected hits from random selection). A good screen achieves EF > 10 at 1%.
6. Select 50-200 compounds for experimental testing: prioritize chemical diversity (cluster by Tanimoto distance, select centroids), favorable predicted properties (solubility, permeability), and synthetic accessibility (SA score < 4). Include known actives as positive controls and decoys as negative controls.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
