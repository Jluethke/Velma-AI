# Plate Reader Importer

Import plate reader data and map well positions to experimental conditions.

## Inputs

- `plate-reader-files`: Raw absorbance, fluorescence, or luminescence output from the plate reader
- `plate-layout`: Well-to-condition mapping: compound, concentration, and control assignments

## Outputs

- `mapped-readings`: Signal values linked to compound, concentration, and replicate identifiers
- `control-wells`: Identified positive control (100% viable) and negative control (0% viable) wells

## Process

1. Parse plate reader output and extract signal values indexed by well position
2. Map each well to its experimental condition using the plate layout
3. Identify and separate control wells (positive, negative, blank)
4. Flag any wells with anomalous readings (air bubbles, edge effects)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
