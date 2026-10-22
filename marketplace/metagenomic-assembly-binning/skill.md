# Metagenomic Assembly Binning

Assemble metagenomic reads into contigs and bin contigs into metagenome-assembled genomes (MAGs). MEGAHIT uses a succinct de Bruijn graph with multiple k-mer sizes for memory-efficient assembly. MetaBAT2 bins contigs by tetranucleotide frequency and differential coverage across samples. CheckM evaluates MAG quality using single-copy marker genes.

## Inputs

- `decontaminated-fastq`: Quality-filtered metagenomic reads for assembly
- `taxonomic-profile`: Taxonomic composition to guide expected genome recovery

## Outputs

- `metagenome-assembled-genomes`: Binned MAGs with quality metrics (completeness, contamination, strain heterogeneity)
- `assembly-statistics`: Contig N50, total assembly size, number of contigs, coverage distribution

## Process

1. Assemble with MEGAHIT: megahit -1 R1.fq.gz -2 R2.fq.gz -o assembly_out --min-contig-len 1000. MEGAHIT iterates through multiple k-mer sizes (21 to 141 by default) and merges assemblies. For deeply sequenced samples (>50M reads), metaSPAdes may produce longer contigs but requires more memory.
2. Evaluate assembly: calculate N50 (half the assembly is in contigs this length or longer), total assembly size, number of contigs >1kb, and maximum contig length. Map reads back to the assembly (bowtie2) to calculate per-contig coverage. Good metagenomic assemblies have N50 of 5-50kb depending on community complexity.
3. For multi-sample experiments, consider co-assembly (combining reads from all samples for assembly) vs per-sample assembly. Co-assembly improves contiguity for shared species but may create chimeric contigs from closely related strains. Differential coverage binning requires per-sample read mapping to the assembly.
4. Bin contigs with MetaBAT2: map reads from each sample to the assembly to generate depth files, then run metabat2 -i contigs.fa -a depth.txt -o bins/bin. MetaBAT2 clusters contigs by tetranucleotide frequency composition and coverage correlation across samples. Alternative binners: CONCOCT, MaxBin2. Running multiple binners and selecting the best bin set with DAS Tool improves overall recovery.
5. Evaluate MAG quality with CheckM: checkm lineage_wf bins/ checkm_output/. CheckM uses 104 single-copy marker genes to estimate completeness (fraction of markers present) and contamination (fraction of markers duplicated). MIMAG standards: high-quality (>90% complete, <5% contamination, 23S/16S/5S rRNA, >18 tRNAs), medium-quality (>50% complete, <10% contamination).
6. Taxonomically classify MAGs with GTDB-Tk, which places genomes on the Genome Taxonomy Database reference tree using 120 bacterial or 53 archaeal marker genes. GTDB-Tk provides standardized taxonomy that resolves many polyphyletic groups in NCBI taxonomy.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
