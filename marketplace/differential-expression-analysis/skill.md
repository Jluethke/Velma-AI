# Differential Expression Analysis

Identify differentially expressed genes between conditions using count-based statistical models. DESeq2 fits a negative binomial generalized linear model per gene, estimates dispersion using empirical Bayes shrinkage across genes, and tests for differential expression with a Wald test. limma-voom provides a complementary approach using precision weights derived from the mean-variance relationship.

## Inputs

- `gene-count-matrix`: Raw count matrix (not normalized) with genes as rows and samples as columns
- `sample-metadata`: Sample information table with condition, batch, and other covariates

## Outputs

- `de-results`: Per-gene differential expression results: log2 fold change, p-value, adjusted p-value, base mean expression
- `normalized-counts`: Normalized count matrix (DESeq2 median-of-ratios or TMM) for visualization

## Process

1. Construct DESeq2 dataset: dds <- DESeqDataSetFromMatrix(countData, colData, design = ~ batch + condition). Include batch in the design formula if samples were processed in batches. The variable of interest (condition) should be last in the formula.
2. Pre-filter low-count genes: keep genes with at least 10 counts across all samples (rowSums(counts(dds)) >= 10). This reduces multiple testing burden and removes genes with no statistical power.
3. Run DESeq2: dds <- DESeq(dds). This performs three steps internally: estimation of size factors (median of ratios normalization), estimation of gene-wise dispersions (maximum likelihood followed by empirical Bayes shrinkage toward the fitted mean-dispersion trend), and negative binomial GLM fitting with Wald test.
4. Extract results: res <- results(dds, contrast = c('condition', 'treatment', 'control'), alpha = 0.05). The lfcShrinkage function applies adaptive shrinkage (apeglm method) to log2 fold changes, reducing noise for low-count genes while preserving large effects. Use shrunken LFCs for ranking and visualization, original LFCs for effect size reporting.
5. For complex designs with continuous covariates, interaction terms, or repeated measures, consider limma-voom: voom transforms counts to log-CPM with precision weights derived from the mean-variance trend, then fits standard linear models. limma handles arbitrary design matrices and contrasts more flexibly than DESeq2.
6. Quality checks: MA plot (log2FC vs mean expression) should show symmetric fold change distribution centered at zero. PCA of regularized log-transformed counts (rlog or vst) should separate conditions. Dispersion plot should show shrinkage toward the trend line.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
