# Fcs File Importer

Import and parse FCS files into a structured dataset for analysis.

## Inputs

- `fcs-files`: Raw FCS files from the cytometer
- `panel-definition`: Antibody panel with fluorochrome assignments and channels

## Outputs

- `parsed-events`: Event-level data matrix with channel names and metadata
- `acquisition-summary`: Event count, acquisition time, and instrument settings per file

## Process

1. Read the FCS file headers to extract parameter names and metadata
2. Parse the event data into a matrix of channels by events
3. Apply any necessary transformations (biexponential, logicle, arcsinh)
4. Summarize acquisition statistics for each sample

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
