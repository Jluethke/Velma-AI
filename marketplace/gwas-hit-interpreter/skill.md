# Gwas Hit Interpreter

Annotate and interpret genome-wide significant hits in their biological context.

## Inputs

- `adjusted-results`: Significant and suggestive variants with positions

## Outputs

- `annotated-hits`: Significant loci with nearest genes, eQTL data, and known associations
- `biological-interpretation`: Summary of implicated pathways and candidate causal genes

## Process

1. Map each lead SNP to its genomic context (nearest gene, coding consequence, regulatory annotations).
2. Cross-reference with eQTL databases (GTEx) to identify genes whose expression is affected.
3. Check the GWAS catalog for prior associations at the same loci.
4. Summarize the biological story: which pathways and tissues are implicated.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
