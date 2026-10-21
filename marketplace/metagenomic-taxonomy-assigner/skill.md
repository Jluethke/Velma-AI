# Metagenomic Taxonomy Assigner

Assign taxonomy to filtered reads using 16S marker gene or whole-genome shotgun methods.

## Inputs

- `filtered-reads`: Quality-filtered FASTQ files
- `taxonomy-database`: Reference database for classification (Silva, GTDB, Kraken2 DB)

## Outputs

- `taxonomy-table`: OTU or ASV table with taxonomic assignments and counts per sample
- `classification-summary`: Fraction classified, dominant taxa, and unclassified rate

## Process

1. Select the classification approach (amplicon: DADA2/QIIME2; shotgun: Kraken2/MetaPhlAn)
2. Run the classifier against the reference database
3. Build the taxonomy count table at each rank (phylum through species)
4. Summarize classification rates and dominant taxa

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
