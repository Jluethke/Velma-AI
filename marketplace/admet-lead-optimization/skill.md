# Admet Lead Optimization

Predict absorption, distribution, metabolism, excretion, and toxicity (ADMET) properties and optimize lead compounds through iterative structure-activity relationship analysis. ADMET prediction uses QSAR models trained on experimental data. Lead optimization balances potency, selectivity, and drug-like properties through medicinal chemistry design guided by free energy perturbation calculations.

## Inputs

- `hit-list`: Confirmed hits from virtual screening or experimental assays with IC50/Ki values
- `target-structure`: Target protein structure for binding mode analysis

## Outputs

- `optimized-leads`: Lead compounds with improved potency, selectivity, and ADMET profiles
- `sar-analysis`: Structure-activity relationship maps showing how modifications affect activity and properties

## Process

1. Predict ADMET properties for all hits using validated QSAR models: lipophilicity (XLOGP3 or consensus LogP), aqueous solubility (ESOL model: LogS from molecular descriptors), Caco-2 permeability (predictor of oral absorption), CYP inhibition (CYP3A4, 2D6, 2C9: major metabolic liabilities), plasma protein binding, hERG channel inhibition (cardiac toxicity: pIC50 > 6 is a red flag), and blood-brain barrier permeability (TopoPSA < 90 for CNS penetration, > 90 for peripherally restricted).
2. Triage hits by ADMET profile: remove compounds with predicted hERG IC50 < 10 micromolar, insoluble (LogS < -6), metabolically unstable (multiple CYP liabilities), or Ames-positive (mutagenic). Remaining compounds are lead candidates for optimization.
3. Analyze binding mode of top leads: examine docking poses in the context of the binding site. Identify key interactions: which hydrogen bonds, hydrophobic contacts, and water-mediated bridges drive binding. Map SAR by comparing active vs inactive analogs: which substituent positions tolerate changes (solvent-exposed) vs are critical (buried in the pocket).
4. Design optimization analogs using free energy perturbation (FEP+): relative binding free energy calculations predict how chemical modifications affect binding affinity within approximately 1 kcal/mol accuracy. Plan modifications: replace metabolic soft spots (oxidizable groups: benzylic CH, anilines), improve solubility (add polar groups at solvent-exposed positions), tune LogP toward the 1-3 range, and explore bioisosteric replacements for problematic groups.
5. Assess selectivity: dock leads against anti-targets (closely related family members, hERG, off-target GPCRs) and calculate selectivity ratios. Counter-screen predictions guide modifications that improve selectivity: identify residues that differ between the target and anti-target binding sites, design substituents that exploit those differences.
6. Iterate: synthesize top-ranked designs (prioritize by predicted affinity improvement, synthetic accessibility, and ADMET improvement), test experimentally, update the SAR model, and design the next round. Typically 3-5 optimization cycles are needed to advance from a micromolar hit to a sub-100 nanomolar lead with acceptable ADMET.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
