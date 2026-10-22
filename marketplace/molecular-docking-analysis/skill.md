# Molecular Docking Analysis

Predict protein-protein or protein-ligand binding modes and estimate binding affinity. HADDOCK uses ambiguous interaction restraints (AIRs) derived from experimental data (mutagenesis, cross-linking, NMR CSPs) or predicted interface residues. AutoDock Vina performs small-molecule docking using empirical scoring. Docking results guide drug design and interaction studies.

## Inputs

- `validated-structure`: Validated receptor structure (protein)
- `ligand-structures`: Small molecule SDF/MOL2 or partner protein PDB

## Outputs

- `docking-poses`: Ranked binding poses with scores, interaction fingerprints, and contact residues
- `binding-analysis`: Predicted binding affinity, key interactions (H-bonds, hydrophobic, salt bridges), binding site characterization

## Process

1. For protein-protein docking with HADDOCK: define active residues (experimentally determined interface residues or predicted by CPORT/InterfaceResidues) and passive residues (surface neighbors of active residues). HADDOCK performs rigid-body docking, semi-flexible refinement, and water refinement in three stages.
2. For small-molecule docking with AutoDock Vina: prepare receptor (add hydrogens, assign Gasteiger charges, convert to PDBQT) and ligand (generate 3D coordinates with RDKit, add hydrogens, assign charges, enumerate tautomers and protonation states at pH 7.4). Define search box around the binding site with 5 Angstrom padding.
3. Run docking with exhaustiveness proportional to binding site size (default 8 for standard sites, 32 for large or shallow sites). Vina returns up to 20 poses ranked by predicted binding affinity (kcal/mol). Accuracy: the native pose is typically within the top 3 ranked poses for well-defined binding pockets.
4. Analyze binding poses: identify hydrogen bonds (donor-acceptor distance < 3.5 Angstrom, angle > 120 degrees), hydrophobic contacts (carbon-carbon distance < 4.0 Angstrom), salt bridges (charged atom distance < 4.0 Angstrom), and pi-stacking (ring centroid distance < 5.5 Angstrom, angle < 30 degrees).
5. For higher accuracy, refine top docking poses with short MD simulations (10-20ns) and calculate binding free energy using MM-PBSA or MM-GBSA. MM-PBSA decomposes binding energy into van der Waals, electrostatic, polar solvation, and nonpolar solvation components per residue.
6. Cross-validate docking results: redock a known ligand (if crystal structure exists) to verify the protocol reproduces the experimental binding mode (RMSD < 2.0 Angstrom to crystal pose). If self-docking fails, the protocol or scoring function needs adjustment.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
