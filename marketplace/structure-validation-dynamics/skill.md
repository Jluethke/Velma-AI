# Structure Validation Dynamics

Validate predicted structures using stereochemical analysis and molecular dynamics simulation. MolProbity evaluates Ramachandran geometry, rotamer quality, and steric clashes. GROMACS molecular dynamics tests structural stability: a well-predicted structure should remain stable (low RMSD drift) during simulation. MD also reveals flexible regions and can refine side-chain packing.

## Inputs

- `predicted-structure`: PDB file of predicted or modeled structure
- `confidence-metrics`: pLDDT and PAE from prediction step

## Outputs

- `validated-structure`: Final structure after validation and optional MD refinement
- `validation-report`: Stereochemical quality metrics, MD stability analysis, flexibility profile

## Process

1. Run MolProbity analysis: Ramachandran plot (>98% favored, <0.2% outliers for well-refined structures), rotamer analysis (<1% outliers), clashscore (<5 for good structures, <1 for excellent), C-beta deviations (<0.25 Angstrom). AlphaFold2 structures typically have excellent Ramachandran statistics but may have side-chain packing issues.
2. Prepare for MD simulation with GROMACS: select force field (CHARMM36m or AMBER ff19SB for proteins), solvate in a TIP3P water box with at least 12 Angstrom buffer from protein to box edge, add counterions (Na+/Cl-) to neutralize and bring to 150mM ionic strength.
3. Energy minimization: steepest descent followed by conjugate gradient until maximum force falls below 1000 kJ/mol/nm. This removes steric clashes introduced by solvation.
4. Equilibration: 100ps NVT (constant temperature, Berendsen thermostat at 300K, position restraints on protein heavy atoms) followed by 100ps NPT (add Parrinello-Rahman barostat at 1 bar). Release position restraints gradually.
5. Production MD: run 50-100ns at minimum for stability assessment. Analyze RMSD of backbone atoms relative to starting structure: stable structures converge to a plateau below 3 Angstrom. Continuously rising RMSD indicates the starting structure is not a stable minimum. RMSF (root mean square fluctuation) per residue reveals flexible loops and rigid core.
6. Compare MD-derived flexibility (RMSF) with AlphaFold2 pLDDT: low-pLDDT regions should correspond to high-RMSF regions. Disagreement warrants investigation (the MD simulation may sample alternative conformations not captured by AlphaFold2).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
