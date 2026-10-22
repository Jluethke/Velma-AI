# Rna Seq Alignment Quantification

Align RNA-seq reads with splice awareness and quantify gene and transcript expression. STAR aligner performs two-pass alignment: first pass discovers novel splice junctions, second pass uses the augmented junction database for final alignment. For transcript-level quantification without alignment, Salmon uses quasi-mapping and expectation-maximization to estimate transcript abundances directly from reads.

## Inputs

- `trimmed-rna-fastq`: Quality-trimmed RNA-seq FASTQ files
- `reference-annotation`: GTF gene annotation file (Ensembl or GENCODE) and genome FASTA

## Outputs

- `gene-count-matrix`: Genes-by-samples count matrix with raw integer counts
- `transcript-abundances`: Transcript-level TPM and estimated counts from Salmon

## Process

1. Build STAR genome index with annotation: STAR --runMode genomeGenerate --genomeDir star_index --genomeFastaFiles ref.fa --sjdbGTFfile genes.gtf --sjdbOverhang ReadLength-1. The overhang parameter should be read length minus 1 for maximum sensitivity.
2. Run STAR two-pass alignment: first pass identifies novel junctions (SJ.out.tab), second pass adds these to the known junction database. This captures sample-specific splice events not in the reference annotation. Use --outSAMtype BAM SortedByCoordinate for direct sorted BAM output.
3. Key STAR parameters for standard RNA-seq: --outFilterMultimapNmax 20 (allow up to 20 multi-mapping locations), --alignSJoverhangMin 8 (minimum overhang for unannotated junctions), --outFilterMismatchNoverReadLmax 0.04 (maximum mismatch rate 4%).
4. Quantify gene-level counts with featureCounts from the Subread package: featureCounts -a genes.gtf -o counts.txt -p --countReadPairs -T threads aligned.bam. Use --countReadPairs for paired-end data. Default counting mode (Union) assigns reads to the gene with which they have the largest overlap.
5. For transcript-level quantification, run Salmon in mapping-based mode: salmon quant -i salmon_index -l A -1 R1.fq.gz -2 R2.fq.gz -o quant_output. The -l A flag enables automatic library type detection. Salmon's quasi-mapping is 10-20x faster than alignment-based counting.
6. Salmon outputs TPM (transcripts per million) and estimated counts per transcript. Use tximport in R to aggregate transcript-level estimates to gene level while accounting for transcript length changes across samples (important for differential transcript usage).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
