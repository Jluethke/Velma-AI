# Image Quality Reviewer

Review the sample output, adjust parameters, and finalize the pipeline setup.

## Inputs

- `sample-output`: Test batch of processed images
- `pipeline-config`: Current pipeline configuration

## Outputs

- `final-config`: Finalized pipeline configuration after quality review adjustments
- `batch-processing-document`: Complete setup document for the batch image processing pipeline

## Process

1. Review each sample image against the quality criteria: resolution, file size, visual artifacts, watermark placement.
2. Adjust parameters where the output does not meet the criteria (reduce compression, change crop coordinates, resize watermark).
3. Run a second test batch to verify the adjustments.
4. Compile the batch processing setup document: steps, parameters, folders, triggers, error handling, and quality review schedule.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
