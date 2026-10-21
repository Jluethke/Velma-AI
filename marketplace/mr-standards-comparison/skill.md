# Mr Standards Comparison

Compare measured chemical shifts, relaxation times, or volumes against published standards and atlases.

## Inputs

- `quantification-results`: Measured values
- `assignment-table`: What was measured

## Outputs

- `standards-comparison-table`: Measured vs reference values with literature sources
- `deviation-flags`: Values that fall outside expected ranges

## Process

1. Look up reference chemical shifts, relaxation times, or normative volumes in published databases.
2. Compute the deviation between measured and reference values.
3. Flag values outside the expected range, accounting for instrument, solvent, and field strength differences.
4. Note any findings that may require follow-up experiments or clinical correlation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
