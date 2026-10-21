# Bioinfo Reproducible Workflow

Package the entire analysis as a reproducible workflow with containerized environments, version-locked tools, and a runnable pipeline definition.

## Inputs

- `figure-set`: Final analysis outputs to include in the reproducible package
- `qc-report`: QC data for the methods section

## Outputs

- `workflow-package`: Snakemake or Nextflow pipeline with Dockerfile and version-locked dependencies
- `methods-draft`: Draft methods section describing every analysis step, tool, and version

## Process

1. Write the pipeline definition (Snakemake or Nextflow) linking every step from QC to figures
2. Create a Dockerfile or Conda environment file locking every tool and library version
3. Test the full pipeline from raw reads to final outputs on a clean machine or CI runner
4. Draft the methods section with tool names, versions, parameters, and database dates

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
