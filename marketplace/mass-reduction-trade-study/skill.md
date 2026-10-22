# Mass Reduction Trade Study

When mass exceeds budget, run a structured trade study to find the cheapest mass to remove using a cost-of-weight metric and the right methods.

## Inputs

- `growth-trend`: The overrun and the subsystems trending over their not-to-exceed limit
- `cg-inertia-estimate`: The current mass distribution and the center-of-gravity and inertia effects any change will have

## Outputs

- `reduction-options`: The ranked mass-reduction options with the mass saved, the cost and risk of each, and the center-of-gravity effect
- `recommended-actions`: The selected set of reductions that recover the budget at acceptable cost and risk, with the net mass and center-of-gravity result

## Process

1. Set the value of removing mass with a cost-of-weight metric. A program has an implied or explicit price per kilogram removed (often high for launch, aerospace, or range-limited systems); the metric tells you how much cost and risk a kilogram of saving justifies, so trades are decided on value, not on which engineer argues hardest.
2. Find the mass concentrations first. Most mass sits in a few places; a rank-ordered mass list (heaviest components and subsystems first) shows where a given percentage reduction yields the most kilograms. Chasing grams off a hundred small parts rarely beats redesigning the few heavy ones.
3. List the reduction methods against their cost and risk. Options run from low-risk (remove unused margin, thin lightly-loaded regions) through moderate (material substitution to higher specific-strength alloys or composites, topology optimization of structural parts) to high-risk (reducing a safety margin, deleting redundancy). Rank by mass saved per unit cost and by the risk each carries.
4. Check each option's effect on center of gravity and inertia, not just mass. Removing mass from one end moves the center of gravity and can push it out of its envelope even while reducing total mass; a mass reduction that violates the center-of-gravity requirement is not a valid option. Carry the center-of-gravity and inertia effect through the trade.
5. Select the set that recovers the budget at the lowest cost and risk, and re-check the system. Pick the combination of reductions that gets back inside the budget with margin, confirm the net center of gravity and inertia still meet their limits, and route the changes through configuration control. Record the options not taken so the next overrun does not re-study them.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
