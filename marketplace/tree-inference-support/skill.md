# Tree Inference Support

Infer phylogenetic trees using maximum likelihood (RAxML-NG, IQ-TREE) and Bayesian (MrBayes, BEAST2) methods, and assess branch support. ML finds the tree topology and branch lengths that maximize the probability of observing the data under the substitution model. Bayesian methods sample the posterior distribution of trees proportional to likelihood times prior, providing credible intervals on topology and parameters.

## Inputs

- `curated-alignment`: Quality-trimmed alignment in appropriate format
- `substitution-model`: Best-fit substitution model from model selection

## Outputs

- `phylogenetic-tree`: Best ML tree or Bayesian consensus tree with branch support values
- `tree-diagnostics`: Bootstrap support distribution, MCMC convergence metrics (ESS, PSRF), tree likelihood

## Process

1. Run RAxML-NG for maximum likelihood inference: raxml-ng --all --msa alignment.phy --model GTR+G --bs-trees 1000. The --all flag performs ML tree search (20 random + 20 parsimony starting trees) followed by 1000 bootstrap replicates and maps bootstrap support onto the ML tree. IQ-TREE is an alternative that often finds higher-likelihood trees with ultrafast bootstrap (UFBoot2): iqtree2 -s alignment.phy -m GTR+G -bb 1000 -alrt 1000.
2. Interpret bootstrap support: values above 70% (standard bootstrap) or 95% (UFBoot2) indicate well-supported clades. UFBoot2 values are less biased than standard bootstrap for large datasets but the threshold is higher. SH-aLRT (approximate likelihood ratio test) provides a complementary support measure.
3. For Bayesian inference with MrBayes: set the substitution model (lset nst=6 rates=gamma for GTR+G), run two independent MCMC chains (nruns=2, nchains=4 per run: 1 cold + 3 heated) for sufficient generations (typically 1-10 million depending on dataset size).
4. Assess MCMC convergence: average standard deviation of split frequencies should fall below 0.01. Check effective sample size (ESS) for all parameters in Tracer: ESS > 200 for all parameters. If ESS is low, run longer or adjust heating temperature. Discard burn-in (first 25% of samples by default).
5. For the Bayesian consensus tree: 50% majority-rule consensus shows clades appearing in more than half of the posterior sample. Posterior probabilities > 0.95 indicate strong support. Bayesian posterior probabilities tend to be higher than bootstrap values for the same data and should be interpreted with different thresholds.
6. Compare ML and Bayesian trees: concordant strongly-supported clades are reliable. Conflicts between methods at well-supported nodes indicate model sensitivity and warrant investigation (e.g., long-branch attraction in ML, prior sensitivity in Bayes).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
