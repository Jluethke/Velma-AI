# Annotation Batch Manager

Run the annotation batches and track progress.

## Inputs

- `qc-protocol`: Quality control procedures
- `tool-config`: Configured annotation tool

## Outputs

- `annotated-dataset`: Completed annotations
- `annotation-report`: Quality metrics, throughput, and issues

## Process

1. Assign batches to annotators based on capacity.
2. Monitor quality metrics during annotation.
3. Flag and retrain annotators below the quality threshold.
4. Compile the final annotated dataset with quality report.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
