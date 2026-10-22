# Molecular Clock Dating

Estimate divergence times using molecular clock models calibrated with fossil or biogeographic data. BEAST2 jointly estimates the tree topology, branch lengths (in substitutions), and divergence times (in years) by combining a substitution model, a clock model (strict or relaxed), a tree prior (birth-death, coalescent), and calibration priors (age constraints on internal nodes from fossil evidence).

## Inputs

- `curated-alignment`: Sequence alignment for clock analysis
- `calibration-data`: Fossil or biogeographic calibration points with age ranges and associated node constraints

## Outputs

- `dated-tree`: Time-calibrated phylogeny with divergence time estimates and 95% HPD intervals
- `clock-rate-estimates`: Substitution rate estimates (substitutions/site/year) with uncertainty

## Process

1. Choose clock model: strict clock assumes constant rate across all lineages (appropriate when rate variation is low, e.g., closely related viral sequences). Relaxed clock (uncorrelated lognormal in BEAST2) allows each branch to have its own rate drawn from a lognormal distribution, accommodating rate variation across lineages. Use Bayes factor comparison (path sampling) to select between strict and relaxed clocks.
2. Set calibration priors: for each calibration node, define a prior distribution on the node age. Fossil calibrations typically use lognormal or exponential priors with a hard minimum (fossil age = earliest possible divergence) and soft maximum. Minimum age: the age of the oldest fossil assigned to a clade. Maximum age: informed by absence of older fossils or biogeographic constraints.
3. Configure BEAST2 XML: select substitution model (from ModelTest-NG results), clock model, tree prior (Yule for species-level analysis, birth-death for trees with extinction, coalescent for population-level), and calibration priors. Use BEAUti GUI to assemble the XML or edit manually for complex analyses.
4. Run BEAST2 MCMC: chain length typically 50-200 million generations with sampling every 5000-10000. Monitor ESS for all parameters. Multiple calibration points improve precision and allow cross-validation (remove one calibration and check if the remaining calibrations recover a consistent age).
5. Analyze results in Tracer: verify convergence (ESS > 200 for all parameters), check that calibration priors are updated by the data (posterior differs from prior). Summarize tree set with TreeAnnotator: maximum clade credibility tree with median node heights and 95% HPD intervals.
6. Report divergence times with uncertainty: give the median estimate and 95% HPD interval. HPD intervals of 50% or more of the estimate are common for deep divergences and reflect genuine uncertainty. Cross-reference with published molecular dating studies and geological/fossil record for consistency.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
