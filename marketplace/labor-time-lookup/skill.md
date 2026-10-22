# Labor Time Lookup

Look up the labor guide time for each repair operation on the specific vehicle.

## Inputs

- `repair-operations`: List of repair operations to estimate
- `vehicle-info`: Year, make, model, engine, and trim for accurate labor times

## Outputs

- `labor-times`: Labor guide hours for each operation
- `overlap-adjustments`: Time reductions for operations that share disassembly steps

## Process

1. Look up each repair operation in the labor guide (Mitchell, ALLDATA, or manufacturer).
2. Record the book time in hours for each operation.
3. Identify overlapping operations where disassembly is shared and apply time reductions.
4. Note any operations not in the guide that require a custom time estimate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
