# Fluorescence Fret Analyzer

Analyze Forster resonance energy transfer efficiency from donor-acceptor fluorescence data.

## Inputs

- `corrected-emission`: Emission spectra for donor-only, acceptor-only, and donor-acceptor samples
- `lifetime-fit-results`: Donor lifetimes in absence and presence of acceptor

## Outputs

- `fret-efficiency`: FRET efficiency calculated by intensity ratio and lifetime methods
- `distance-estimate`: Donor-acceptor distance from FRET efficiency using the Forster radius

## Process

1. Calculate FRET efficiency from donor quenching (intensity-based method)
2. Calculate FRET efficiency from donor lifetime shortening (lifetime-based method)
3. Estimate the donor-acceptor distance using the known Forster radius for the pair
4. Compare intensity and lifetime FRET values and note any discrepancy

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
