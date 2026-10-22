# Hard Tooling Investment Decision

Make the hard-tooling investment decision on a frozen design: breakeven volume, payback, tool life, and the risk of committing non-recurring cost.

## Inputs

- `low-rate-production-plan`: The low-rate production results and the demonstrated demand and design stability
- `volume-forecast`: The forecast production volume, rate, and program life over which the hard tool amortizes

## Outputs

- `investment-decision`: The go/no-go on hard tooling with the breakeven volume, payback period, and the unit-cost and rate gains quantified
- `hard-tool-specification`: The hard-tool specification: material, cavity count, expected life, and the rate and tolerance it must deliver

## Process

1. Compute the breakeven volume between bridge and hard tooling. Breakeven is the non-recurring hard-tool cost divided by the per-part saving over bridge tooling; below that volume the bridge tool is cheaper overall, above it the hard tool wins. Compare the breakeven to the forecast volume with margin for forecast error.
2. Require a frozen design before committing. Hard tooling is the point of no cheap return: a design change after a hardened-steel multi-cavity tool is cut is expensive and slow. Confirm the design is frozen under change control and the qualification is complete or nearly so before releasing the hard-tool cut.
3. Specify the tool for the rate and life, not just the part. Set the cavity count from the production rate and cycle time, the tool material (hardened tool steel for millions of cycles, with appropriate coatings and cooling) from the total volume and material abrasiveness, and the cooling and ejection design from the cycle time the rate demands. The tool is a production-rate decision as much as a part decision.
4. Quantify the unit-cost and rate gains that justify the spend. Hard tooling lowers per-part cost (multi-cavity, fast cycle, low scrap) and raises sustainable rate; put numbers on both and show the payback period against the forecast. An investment justified only by 'we will need it eventually' without a volume and payback is not justified.
5. Weigh the downside of committing early against waiting. Committing hard tooling too early risks an expensive change if the design or volume shifts; waiting too long leaves the program on costly bridge tooling and capped rate. State the risk on each side and the trigger conditions, so the decision is made on evidence rather than hope about the forecast.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
