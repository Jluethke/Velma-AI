# Taxonomic Functional Profiling

Profile the taxonomic composition and functional potential of the microbial community. MetaPhlAn uses clade-specific marker genes (approximately 1.1 million markers from 13,500 species) for species-level relative abundance estimation. Kraken2 uses exact k-mer matching against a reference database for fast classification. HUMAnN3 maps reads to UniRef90 gene families and MetaCyc pathways for functional profiling.

## Inputs

- `decontaminated-fastq`: Host-removed metagenomic reads
- `profiling-databases`: MetaPhlAn marker database, Kraken2 database, UniRef90, MetaCyc

## Outputs

- `taxonomic-profile`: Species-level relative abundance table with confidence estimates
- `functional-profile`: Gene family and pathway abundance tables normalized per community and per species

## Process

1. Run MetaPhlAn for species-level taxonomic profiling: metaphlan input.fq.gz --input_type fastq --nproc threads -o profile.tsv. MetaPhlAn maps reads to clade-specific marker genes and estimates relative abundance. It reports at all taxonomic levels (kingdom through species and strain). Strengths: high specificity, quantitative. Limitation: cannot detect species absent from the marker database.
2. Run Kraken2 for complementary taxonomic classification: kraken2 --db kraken_db --paired R1.fq.gz R2.fq.gz --report kreport.txt --output kraken.out. Kraken2 assigns each read to the lowest common ancestor of all species sharing its k-mers. Follow with Bracken for species-level abundance re-estimation from Kraken2's read-level classifications.
3. Run HUMAnN3 for functional profiling: humann --input input.fq.gz --output humann_out. HUMAnN3 first performs taxonomic profiling (using MetaPhlAn), then maps reads to pangenomes of detected species (species-specific gene families), and finally maps unclassified reads against UniRef90 (community-level functional potential). Output includes gene family abundance (RPK: reads per kilobase) and pathway abundance (MetaCyc pathways).
4. Normalize HUMAnN3 output: convert RPK to relative abundance (sum to 1 within each sample) or CPM (copies per million) for cross-sample comparison. Stratified output separates contributions from each species to each gene family/pathway.
5. Compare MetaPhlAn and Kraken2 results: concordant species (both methods detect) are high confidence. Species detected only by MetaPhlAn have strong marker gene evidence. Species detected only by Kraken2 may include false positives from shared k-mers (check Bracken re-estimated abundance).
6. Calculate alpha diversity (Shannon, Simpson, observed species richness) and beta diversity (Bray-Curtis dissimilarity, UniFrac if phylogenetic tree available) from the taxonomic profile. Test for significant differences between groups using PERMANOVA (adonis2) on the distance matrix.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
