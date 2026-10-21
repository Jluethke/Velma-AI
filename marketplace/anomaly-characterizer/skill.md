# Anomaly Characterizer

Describe the anomaly in quantitative terms: location in the dataset, magnitude, duration, shape, and context relative to the surrounding signal.

## Inputs

- `raw-dataset`: The dataset containing the anomaly
- `anomaly-description`: Initial qualitative description of what looks unusual

## Outputs

- `anomaly-profile`: Quantitative characterization of the anomaly
- `context-summary`: Summary of surrounding data behavior

## Process

1. Locate the anomaly within the dataset and extract a window around it.
2. Measure the anomaly's amplitude, duration, and shape parameters.
3. Compare the anomaly against the local baseline and global statistics.
4. Produce a structured profile with all quantitative descriptors.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
