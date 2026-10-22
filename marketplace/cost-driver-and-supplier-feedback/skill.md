# Cost Driver And Supplier Feedback

Identify the cost drivers in the design and fold supplier manufacturability feedback back into the design before release.

## Inputs

- `capability-assessment`: The features and controls driving process difficulty and cost
- `supplier-input`: Quotes, lead times, and manufacturability feedback from the suppliers who would make the part

## Outputs

- `cost-drivers`: The ranked design features and decisions that drive unit cost, tooling cost, and lead time, with the quantified impact of each
- `design-changes`: The supplier-informed design changes that reduce cost or risk, with the saving and any functional trade for each

## Process

1. Build a should-cost model from the process, not just the quote. Estimate material (volume and scrap), machine or cycle time, tooling amortized over volume, finishing, inspection, and yield. The model shows which features drive cost and lets you challenge a quote that is out of line with the physics.
2. Rank cost drivers by their share of unit cost. Often a handful of decisions (a tight tolerance that forces a grind operation, a material that needs special handling, a feature that forces a second setup) dominate. Rank them so the team spends its redesign effort where the money is.
3. Separate recurring unit cost from non-recurring tooling cost against the volume. A hard tool that halves unit cost pays back only above a breakeven volume; at low volume the cheaper-per-part decision may be the higher-unit-cost soft process. Make the recurring-versus-non-recurring trade explicitly against the planned quantity.
4. Bring suppliers in before release, not after. The people who run the process see manufacturability issues the design team cannot: a feature that fits their machine poorly, a material they stock in a different form, a tolerance their process holds easily or not at all. Fold their feedback in while the design can still change cheaply.
5. Decide each change on cost against function with eyes open. For every supplier-suggested change, record the saving and the functional trade, and route anything that touches form, fit, or function through the tolerance and capability steps before accepting it. Capture the accepted changes as the manufacturability-driven design updates for release.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
