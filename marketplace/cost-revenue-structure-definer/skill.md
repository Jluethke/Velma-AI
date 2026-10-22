# Cost Revenue Structure Definer

Define the cost and revenue structure of the investment: fixed costs, variable costs per unit, and revenue per unit.

## Inputs

- `investment-description`: The investment or decision to analyze: what it costs, what it produces, and over what time period
- `cost-estimates`: Estimated fixed costs (one-time and recurring) and variable costs per unit of output

## Outputs

- `cost-structure`: Fixed costs (one-time and monthly recurring), variable cost per unit, and the contribution margin (revenue per unit minus variable cost per unit)
- `break-even-units`: The basic break-even point in units: total fixed costs divided by contribution margin per unit

## Process

1. Separate fixed costs from variable costs. Fixed costs don't change with volume: rent, licenses, equipment, salaries. Variable costs scale with each unit: materials, transaction fees, delivery costs, sales commissions.
2. Calculate the contribution margin per unit: revenue per unit minus variable cost per unit. This is how much each unit contributes toward covering fixed costs. If the contribution margin is negative, the business model is broken at any volume.
3. Calculate the basic break-even in units: total fixed costs divided by contribution margin per unit. For a gym membership: the 'fixed cost' is the monthly fee, the 'revenue per unit' is zero (it's a cost center), so reframe: the 'value per visit' (what you'd pay per drop-in visit) minus zero variable cost, and break-even is the monthly fee divided by the per-visit value.
4. Express the break-even in the most meaningful unit: units sold, visits made, hours billed, or months of operation. This is the volume threshold where the investment starts paying for itself.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
