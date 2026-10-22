# Lever Identification

Identify which lever to pull: improve acquisition, improve retention, or reactivate dormant users. The growth accounting tells you which lever has the most impact.

## Inputs

- `health-diagnosis`: Growth health assessment
- `retention-curves`: Retention by cohort
- `growth-equation-table`: Growth decomposition

## Outputs

- `primary-lever`: The single lever with the highest impact on growth: new acquisition, retention improvement, churn reduction, or reactivation
- `lever-impact-model`: For each lever: what a 10% improvement would produce in absolute growth terms

## Process

1. Model each lever: if you increase new by 10%, what happens to the topline? If you decrease churn by 10%? If you increase resurrection by 10%?
2. The lever with the highest impact per unit of effort is the priority. Usually: churn reduction has the highest impact (it compounds), followed by acquisition, then reactivation.
3. But the priority depends on the diagnosis: if you have a leaky bucket, fix retention first. If retention is strong but growth is slow, invest in acquisition. If you have a large dormant base, try reactivation.
4. Pick one lever. Trying to move all three at once diffuses effort and makes measurement impossible.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
