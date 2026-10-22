# Three Dimensional Genome Analysis

Analyze 3D genome organization from Hi-C data. Hi-C captures chromatin interactions by proximity ligation: crosslinked chromatin is digested with a restriction enzyme, ligated at proximity, and sequenced. Contact matrices reveal topologically associating domains (TADs), A/B compartments (active/inactive chromatin), and chromatin loops (enhancer-promoter contacts). Analysis uses HiC-Pro for processing and cooltools/HiCExplorer for downstream analysis.

## Inputs

- `hic-fastq`: Hi-C paired-end FASTQ files
- `restriction-enzyme`: Enzyme used for chromatin digestion (HindIII, DpnII, MboI, or Arima for multiple enzymes)

## Outputs

- `contact-matrix`: Normalized chromatin interaction matrix at multiple resolutions (1kb, 5kb, 25kb, 100kb, 1Mb)
- `three-d-features`: TAD boundaries, A/B compartments, and chromatin loops with statistical confidence

## Process

1. Process Hi-C reads with HiC-Pro: align each mate independently to the reference (Hi-C mates map to different genomic locations due to ligation), assign read pairs to restriction fragments, filter invalid pairs (dangling ends, self-circles, PCR duplicates), and build the contact matrix. Valid interaction rate should be 40-60% of total read pairs for a good library.
2. Generate contact matrices at multiple resolutions using cooler: 1kb (requires >1 billion valid contacts), 5kb, 25kb (standard for TAD calling), 100kb, and 1Mb (for compartment analysis). Normalize with ICE (iterative correction and eigenvector decomposition) or KR (Knight-Ruiz) balancing to correct for biases from GC content, mappability, and restriction fragment length.
3. Call A/B compartments at 100kb or 1Mb resolution: compute the correlation matrix from the normalized contact matrix, then extract the first eigenvector (PC1) using cooltools eigs-cis. PC1 values partition the genome into A compartment (positive: gene-dense, GC-rich, active chromatin, early replicating) and B compartment (negative: gene-poor, AT-rich, repressive marks, late replicating). Correlate PC1 with GC content to orient the sign correctly.
4. Call TADs at 25kb or 40kb resolution: use insulation score method (cooltools insulation --window-sizes 500000). Insulation score measures the aggregate interaction frequency across each genomic position. TAD boundaries are local minima in the insulation score profile. Alternative methods: TopDom, HiCExplorer hicFindTADs. TAD boundaries are enriched for CTCF binding sites and cohesin.
5. Detect chromatin loops with HiCCUPS (from Juicer) or cooltools dots. Loops appear as focal enrichments (bright spots) in the contact matrix, representing stable interactions between specific loci (e.g., enhancer-promoter pairs). Loop detection requires high resolution (5-10kb) and deep sequencing (>1 billion valid contacts for genome-wide detection).
6. Integrate Hi-C features with other data: overlay TAD boundaries with CTCF ChIP-seq peaks (boundaries should be enriched for convergent CTCF motifs), compare compartment calls with histone marks (A compartment with H3K27ac, B compartment with H3K27me3 or H3K9me3), and intersect loops with enhancer-promoter predictions from H3K27ac and gene expression data.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
