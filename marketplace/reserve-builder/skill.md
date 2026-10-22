# Reserve Builder

Build financial and operational reserves to survive a shock without making decisions under duress.

## Inputs

- `shock-exposure-map`: The exposure assessment from the shock inventory
- `obligations`: Monthly financial obligations

## Outputs

- `reserve-targets`: For each shock category: the target reserve amount (in dollars or months), the current reserve, and the gap
- `reserve-build-plan`: A month-by-month plan to close the gap, starting with the most fragile category

## Process

1. Set the reserve target for each category. The minimum is 6 months of obligations in liquid assets (cash or equivalents accessible within 5 business days).
2. Calculate the gap between current reserves and the target. Rank the gaps by fragility (largest gap relative to exposure first).
3. Build the reserve plan: allocate a fixed monthly amount to reserves, directed to the most fragile category first. Do not spread thin across all categories.
4. Define what counts as a qualifying reserve drawdown. Without this, reserves erode to non-emergencies.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
