# Dataset Inventory Builder

Catalog all datasets, code, and supporting files produced by the research, noting formats, sizes, and sensitivity.

## Inputs

- `project-files`: Root directory or listing of all research outputs
- `sensitivity-classification`: Rules for identifying restricted or embargoed data

## Outputs

- `file-inventory`: Table of every file with path, format, size, description, and sensitivity flag
- `inventory-summary`: Total file count, size, format distribution, and restricted file count

## Process

1. Walk the project directory and record each file's path, format, and size.
2. Write a one-line description for each file or group of files.
3. Flag files containing personal, proprietary, or embargoed data.
4. Summarize totals by format and sensitivity level.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
