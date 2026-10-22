# Micro Ask Design

Design smaller intermediate asks that fill the gaps, so each step is a believable next yes.

## Inputs

- `commitment-gaps`: Transitions with sharp jumps
- `drop-off-points`: Where buyers leave

## Outputs

- `micro-asks`: The new small asks that bridge each gap
- `yes-ladder`: The full ladder of asks from smallest to largest

## Process

1. For each large gap, design one or two smaller asks that a buyer who said the last yes would find easy.
2. Make each micro-ask return value to the buyer, so saying yes feels like a gain, not a concession.
3. Order the asks into a ladder where each rung is only slightly higher than the one below.
4. Check that no rung still contains a hidden large jump that a buyer would balk at.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
