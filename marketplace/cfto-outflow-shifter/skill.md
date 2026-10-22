# Cfto Outflow Shifter

Identify movable outflows and shift them away from valleys.

## Inputs

- `cash-valleys`: The low points to protect
- `recurring-items`: The outflows that might be movable

## Outputs

- `shift-plan`: Movable outflows with proposed new dates
- `protected-outflows`: Fixed obligations left untouched

## Process

1. Classify each outflow as fixed-date or movable.
2. For movable items landing near a valley, propose a new date.
3. Keep fixed obligations untouched.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
