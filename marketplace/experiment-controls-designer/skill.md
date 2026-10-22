# Experiment Controls Designer

Identify and control for confounding variables: things that could change the metric besides your experimental change. If you change the button color on the same day you launch a sale, you cannot attribute the click-through change to the button. The sale is a confound.

## Inputs

- `hypothesis-statement`: What you are testing
- `estimated-runtime`: How long the experiment will run

## Outputs

- `confound-list`: Variables that could affect the metric during the experiment, with the control strategy for each
- `experiment-design`: The design type (A/B split, before/after, crossover) chosen to minimize confounding

## Process

1. List everything else that might change the metric during the runtime: seasonal effects, marketing campaigns, product changes, holidays, competitor actions, personal schedule changes.
2. For each confound, choose a control strategy: hold constant (do not change anything else during the experiment), measure and adjust (track the confound and subtract its effect), or randomize (A/B split so confounds affect both groups equally).
3. Choose the experiment design: A/B split (two groups, same time period, strongest control), before/after (one group, two time periods, weaker control but simpler), or crossover (each group gets both conditions, strongest for individual-level effects).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
