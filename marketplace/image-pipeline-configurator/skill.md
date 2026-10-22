# Image Pipeline Configurator

Configure the input and output folders and the processing automation.

## Inputs

- `processing-steps`: Ordered operations with parameters
- `quality-criteria`: Output quality requirements

## Outputs

- `pipeline-config`: Configuration for the batch pipeline (folders, trigger, tool commands, error handling)
- `sample-output`: A test batch of processed images for quality review

## Process

1. Set up the input folder (watched directory, upload endpoint, or scheduled scan).
2. Configure the processing tool (ImageMagick, Sharp, Pillow, or cloud service) with the step parameters.
3. Set up the output folder with the naming convention for processed files.
4. Run a test batch of 5-10 images and save the output for quality review.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
