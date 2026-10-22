# Cfto Float Valuer

Calculate the value of the improved timing.

## Inputs

- `shift-plan`: The outflow shifts to apply
- `acceleration-plan`: The inflow accelerations to apply

## Outputs

- `float-value`: The value of the freed balance at the carrying rate
- `smoothed-balance-curve`: The balance curve after the shifts and accelerations

## Process

1. Rebuild the balance curve with the shifts and accelerations applied.
2. Measure the reduction in valley depth and overdraft risk.
3. Translate the freed balance into a float value at the carrying rate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
