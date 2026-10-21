# Tensile Report Generator

Compile tensile testing results into a structured mechanical testing report.

## Inputs

- `comparison-table`: Property comparison across specimens
- `necking-assessment`: Failure mode classifications
- `test-metadata`: Test conditions and specimen information

## Outputs

- `tensile-report`: Final report with stress-strain plots, property tables, and conclusions
- `raw-data-archive`: All computed values in tabular format for further use

## Process

1. Assemble overlay stress-strain plots with key properties annotated
2. Build the property summary table with statistics and standard reference comparisons
3. Write the interpretation section covering material behavior and failure modes
4. Package raw data and computed values for archival

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
