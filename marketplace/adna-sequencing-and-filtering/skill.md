# Adna Sequencing And Filtering

Sequence the library and filter reads for endogenous content, removing modern contamination and low-quality sequences.

## Inputs

- `sequencing-library`: Indexed aDNA library on the sequencer
- `reference-genome`: Target reference genome for alignment

## Outputs

- `filtered-alignments`: BAM file of quality-filtered, deduplicated alignments to the reference
- `endogenous-content-report`: Percent endogenous, duplication rate, and coverage statistics

## Process

1. Demultiplex and trim adapters from the raw sequencing reads
2. Align to the reference genome with a mapper that handles short reads (BWA aln or equivalent)
3. Remove PCR duplicates and filter for mapping quality and minimum length
4. Compute endogenous content, coverage, and duplication rate

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
