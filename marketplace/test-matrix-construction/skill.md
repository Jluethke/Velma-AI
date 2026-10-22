# Test Matrix Construction

Build the test matrix: the factors, levels, replicates, and article count that answer the questions at the required confidence without wasting articles.

## Inputs

- `test-objectives`: The engineering questions and the effects to be measured, each with a required resolution and confidence
- `resource-constraints`: Available articles, test time, facility slots, and cost per run

## Outputs

- `test-matrix`: The ordered set of runs: factors and levels per run, replicates, and the article assigned to each
- `statistical-basis`: The confidence and resolution the matrix supports, and the assumptions (effect size, scatter) behind the article count

## Process

1. List the factors and separate the ones you vary from the ones you hold fixed or block. A factor held fixed must be recorded; a nuisance factor that cannot be held fixed (ambient temperature, operator) should be blocked or randomized so it does not alias with the effect of interest.
2. Choose the design structure to the question. Use a full factorial when factors are few (2 to 4) and interactions matter; use a fractional factorial or a response-surface design when factors are many and runs are expensive; use one-factor-at-a-time only to isolate a known mechanism, never to explore an interaction-rich space.
3. Size the replicate count from the expected scatter and the effect you must resolve. The number of runs scales roughly with the square of (scatter divided by the effect you need to detect). If a prior build showed 8% coefficient of variation and you must resolve a 5% change at 90% confidence, one run will not do; estimate the replicates before committing articles.
4. Allocate articles to runs with destructive testing in mind. A destructive test consumes an article per run, so the matrix and the article budget are the same problem; sequence non-destructive runs first on an article, then its one destructive run last. Reserve spare articles for re-runs of outliers.
5. Randomize or block the run order against drift. Facility warm-up, calibration drift, and ambient change over a multi-day campaign can masquerade as a factor effect. Randomize run order, or block by day and include a repeated reference run to detect and correct drift.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
