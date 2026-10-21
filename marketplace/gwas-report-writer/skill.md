# Gwas Report Writer

Produce the GWAS report with Manhattan plot, QQ plot, hit table, and biological interpretation.

## Inputs

- `annotated-hits`: Annotated significant loci
- `biological-interpretation`: Pathway and tissue summary
- `genomic-inflation`: QQ plot and lambda GC

## Outputs

- `gwas-report`: The full GWAS analysis report
- `summary-statistics-file`: Complete summary statistics for public deposition

## Process

1. Present Manhattan and QQ plots with the genomic inflation factor.
2. Table all genome-wide significant loci with effect sizes, frequencies, and annotations.
3. Interpret findings in the context of known biology and prior GWAS.
4. Document software, versions, and parameters for reproducibility.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
