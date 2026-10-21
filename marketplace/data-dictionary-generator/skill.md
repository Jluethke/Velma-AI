# Data Dictionary Generator

Generate a data dictionary describing every variable in every dataset: name, type, unit, allowed values, and meaning.

## Inputs

- `file-inventory`: Catalog of data files
- `project-files`: The actual data files to inspect

## Outputs

- `data-dictionary`: Table of all variables across all datasets with full descriptions
- `readme-file`: Human-readable README summarizing the data collection and file structure

## Process

1. For each tabular dataset, list every column with name, data type, unit, and description.
2. For each non-tabular file, describe the content and format.
3. Write the README covering the study context, methods summary, and file relationships.
4. Cross-reference the data dictionary with the metadata records for consistency.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
