# Somatic Variant Calling

Call somatic mutations from tumor-normal paired samples or tumor-only samples. GATK Mutect2 uses a local assembly approach similar to HaplotypeCaller but models somatic allele fractions (potentially below 50%) and filters germline variants using a panel of normals and population allele frequency databases. Key parameters: minimum allele fraction for detection, contamination estimation, and orientation bias artifact filtering.

## Inputs

- `tumor-bam`: Analysis-ready BAM from tumor sample
- `normal-bam`: Matched normal BAM from same patient (optional but strongly recommended)
- `panel-of-normals`: VCF of recurrent artifacts and germline variants from a set of normal samples

## Outputs

- `somatic-vcf`: Filtered VCF of somatic mutations with allele fractions and filter annotations
- `somatic-calling-metrics`: Mutation count by type, TMB estimate, signature-relevant statistics

## Process

1. Run Mutect2 with tumor-normal pair: gatk Mutect2 -R ref.fa -I tumor.bam -I normal.bam -normal normal_sample_name --germline-resource gnomad.vcf --panel-of-normals pon.vcf -O somatic_raw.vcf. The germline resource (gnomAD) provides population allele frequencies for germline filtering.
2. Estimate cross-sample contamination: gatk GetPileupSummaries followed by CalculateContamination. Contamination above 2% warrants investigation. The contamination estimate feeds into FilterMutectCalls.
3. Collect F1R2 read orientation counts during Mutect2 (--f1r2-tar-gz), then run LearnReadOrientationModel to build an artifact prior. FFPE samples have characteristic C>T artifacts in a specific read orientation.
4. Filter calls: gatk FilterMutectCalls -R ref.fa -V somatic_raw.vcf --contamination-table contamination.table --ob-priors orientation_model.tar.gz -O somatic_filtered.vcf. This applies statistical filters for strand bias, contamination, sequencing artifacts, and germline probability.
5. For tumor-only calling (no matched normal), Mutect2 relies more heavily on the panel of normals and gnomAD for germline removal. Expect higher false positive rate. Build panel of normals from at least 40 unrelated normal samples processed identically.
6. Evaluate somatic call quality: tumor mutational burden (TMB) varies by cancer type (melanoma: 10-50 mut/Mb, lung: 5-20, breast: 1-5). Novel and known driver mutations should be present at allele fractions consistent with tumor purity and ploidy.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
