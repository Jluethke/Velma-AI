# Mr Peak Assignment

Assign peaks in an NMR spectrum to molecular fragments, or segment regions in an MRI dataset.

## Inputs

- `processed-spectrum-or-image`: Processed NMR spectrum or MRI image
- `sample-or-subject`: Known or expected molecular structure or anatomy

## Outputs

- `assignment-table`: Peak-to-structure assignments (NMR) or region labels (MRI)
- `unassigned-features`: Any peaks or regions that could not be confidently assigned

## Process

1. For NMR: identify chemical shift ranges and match to functional groups using reference tables.
2. For NMR: use splitting patterns and coupling constants to confirm connectivity.
3. For MRI: segment regions of interest using threshold, atlas-based, or machine learning approaches.
4. Flag any unexpected peaks or regions that may indicate impurities, artifacts, or pathology.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
