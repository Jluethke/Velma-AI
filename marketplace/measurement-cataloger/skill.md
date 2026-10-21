# Measurement Cataloger

Catalog every input measurement that enters the calculation, with its value, uncertainty, units, and source.

## Inputs

- `calculation-description`: The formula or procedure whose uncertainty is being assessed
- `measurement-sources`: Instruments, calibration records, and data sheets

## Outputs

- `measurement-table`: Each input with value, uncertainty, units, and source
- `calculation-formula`: The mathematical relationship between inputs and output

## Process

1. Parse the calculation to identify every input variable.
2. For each input, record its measured value, stated uncertainty, and units.
3. Note the source of each uncertainty estimate (manufacturer spec, calibration certificate, repeated measurement).
4. Write out the functional relationship: output = f(input_1, input_2, ...).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
