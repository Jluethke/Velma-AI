# Annual Manual Cost

Compute the annual time the task consumes by hand by multiplying time per occurrence by yearly frequency. This is the recurring cost that automation would remove and the baseline every other number is compared against.

## Inputs

- `time-per-occurrence`: Time per instance
- `occurrence-frequency`: Instances per window

## Outputs

- `annual-manual-hours`: Total yearly hours the task consumes by hand
- `manual-cost-basis`: The assumptions behind the annual figure

## Process

1. Scale the frequency to a full year.
2. Multiply annual frequency by time per occurrence to get annual manual hours.
3. Carry the best-case and worst-case ranges through the multiplication.
4. Record the assumptions so the baseline can be checked and revised.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
