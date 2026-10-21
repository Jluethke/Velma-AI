# Xrd Diffractogram Importer

Import raw XRD data files and convert to a standardized two-theta vs intensity format.

## Inputs

- `raw-data-files`: Raw diffractometer output files (XRDML, RAW, or CSV)
- `instrument-parameters`: Wavelength, slit widths, scan range, step size

## Outputs

- `diffractogram`: Standardized two-theta vs intensity data
- `acquisition-metadata`: Instrument settings and scan conditions

## Process

1. Parse the raw data file format and extract intensity vs two-theta values
2. Validate angular range, step size, and count statistics
3. Normalize intensity units and flag any detector saturation or dropout regions
4. Export the clean diffractogram with acquisition metadata attached

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
