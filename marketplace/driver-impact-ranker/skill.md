# Driver Impact Ranker

Rank the real drivers by the cost of leaving them unaddressed. Cost is the likely departures times the replacement cost, which runs from roughly 50 percent of annual salary for junior roles to 200 percent for senior ones.

## Inputs

- `stated-vs-driver-table`: The stated reasons against the real drivers
- `driver-hypotheses`: The hypothesized real drivers

## Outputs

- `ranked-drivers`: The real drivers ranked by annual cost of inaction
- `cost-of-inaction`: For each driver, the estimated annual cost, with high performers counted separately

## Process

1. For each driver, estimate the departures per year it is likely causing from the cluster sizes.
2. Multiply by the replacement cost for that role level to get an annual cost of inaction.
3. Rank the drivers by annual cost; the most expensive driver is the first lever to pull.
4. Count high performers separately from low performers, since losing high performers to a driver costs more than the headcount alone suggests.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
