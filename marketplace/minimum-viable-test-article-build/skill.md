# Minimum Viable Test Article Build

Build the simplest article that answers the test questions, using the fastest process that preserves the physics under test.

## Inputs

- `article-scope`: The minimum feature set and fidelity from the scoping step
- `shop-capability`: Available in-house processes, lead times, and material stock (machining, 3D print, sheet forming, hand layup)

## Outputs

- `test-article`: The physical article plus a one-page build record of actual dimensions, material lot, and any deviations from intent
- `fidelity-caveats`: The explicit list of ways this article differs from the production design, and which test results those differences could bias

## Process

1. Pick the process by lead time first, then representativeness. In-house 3-axis machining of 6061 in two days beats an outsourced 7075 forging in six weeks when the question is geometry, not alloy strength. Reserve long-lead production processes for the article that answers the question only they can answer.
2. Build to the as-designed nominal but measure the as-built actual. Record the real wall thickness, the real weld penetration, the real surface finish. A prototype that fails at 80% of predicted load often failed because the as-built part was 15% thinner than drawing, not because the design was wrong.
3. Instrument during build, not after. Bond strain gauges before closing a structure, embed thermocouples before potting, add tap points before final assembly. Access you skip now costs a full rebuild later.
4. Accept cosmetic and non-load-path defects; reject anything that touches the physics under test. A rough as-printed surface on a stiffness coupon is fine; a 0.5 mm void in the bond line of a bond-strength coupon invalidates the test.
5. Make at least two identical articles when the test is destructive or the result is noisy. A single data point from one article cannot separate a real effect from a build artifact. Two to three articles let you see scatter before you draw conclusions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
