# Binding Curve Importer

Import raw radioligand or fluorescent ligand binding data and organize by experiment type.

## Inputs

- `binding-data-files`: Raw counts (CPM, DPM) or fluorescence values at each ligand concentration
- `experiment-design`: Saturation or competition format, nonspecific binding definition, replicate structure

## Outputs

- `specific-binding`: Total minus nonspecific binding at each concentration
- `experiment-metadata`: Ligand identity, receptor source, temperature, and incubation time

## Process

1. Parse raw data files and organize by ligand concentration and replicate
2. Subtract nonspecific binding (defined by excess cold ligand) from total to get specific binding
3. Average replicates and compute standard error
4. Check that the highest concentration approaches saturation for saturation experiments

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
