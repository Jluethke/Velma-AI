# Trivial Many Triage

Triage the trivial many (the bottom 80%): decide which to cut, which to maintain, and which to try to upgrade.

## Inputs

- `vital-few-profile`: Characteristics of the top performers
- `input-output-data`: The full data set

## Outputs

- `cut-list`: Inputs in the bottom 80% that should be dropped because they consume resources and produce negligible output
- `maintain-list`: Inputs that produce modest output but require minimal resources
- `upgrade-candidates`: Inputs that resemble the vital few profile and might respond to more investment

## Process

1. For each input in the bottom 80%, calculate its cost-to-serve: how much time, money, or attention does it consume relative to its output?
2. Inputs with high cost-to-serve and low output are candidates for cutting. These are the customers who demand the most support but generate the least revenue, or the activities that take all day but produce nothing.
3. Inputs with low cost-to-serve and low output can be maintained on autopilot. They do not help much, but they do not cost much either.
4. Inputs that share characteristics with the vital-few profile but have not yet produced high output are upgrade candidates. They might respond to the same treatment that makes the vital few productive.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
