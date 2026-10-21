# Microbial Genomic Annotation

Assemble, annotate, and analyze the whole genome sequence of the isolate to identify virulence factors, resistance genes, and mobile elements.

## Inputs

- `pure-isolate`: DNA extracted from the pure culture
- `resistance-flags`: Phenotypic resistance patterns to confirm genotypically

## Outputs

- `annotated-genome`: Assembled and annotated genome with gene coordinates and functional assignments
- `resistance-genotype`: Identified resistance genes, their genetic context, and mobile element associations
- `virulence-inventory`: Virulence factors, secretion systems, and pathogenicity islands identified

## Process

1. Assemble reads using a hybrid (short + long read) or short-read-only pipeline
2. Annotate with Prokka or PGAP and screen against CARD, VFDB, and ISfinder databases
3. Map resistance genes to mobile elements (plasmids, transposons, integrons) using Abricate and MOB-suite
4. Compare the genome to the closest reference strain and report unique or missing gene content

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
