# Occurrence Record Compiler

Compile and clean species occurrence records from databases and field surveys.

## Inputs

- `species-name`: Taxonomic name of the target species
- `study-extent`: Geographic and temporal bounds for the analysis
- `data-sources`: Databases and collections to query (GBIF, iNaturalist, museum records)

## Outputs

- `clean-occurrences`: Georeferenced occurrence records after quality filtering
- `sampling-bias-assessment`: Description of spatial and temporal biases in the data

## Process

1. Query each data source for records within the study extent
2. Remove duplicates, records with coordinate uncertainty above threshold, and flagged records
3. Thin points spatially to reduce sampling bias (one record per grid cell)
4. Document the filtering steps and number of records retained at each stage

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
