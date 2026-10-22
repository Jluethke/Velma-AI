# Single Point Failure Finder

Scan the proficiency matrix for single points of failure: any skill where only one person is at competent or above. These are the team's vulnerabilities. If that person is sick, quits, or goes on leave, the team cannot perform that function. Rank the single points by impact: how often is this skill needed, and what happens if it is unavailable?

## Inputs

- `proficiency-matrix`: The completed skill/person matrix
- `assessment-confidence`: Confidence levels for each assessment

## Outputs

- `single-points-of-failure`: Every skill with only one person at competent or above, ranked by impact (frequency of need times consequence of unavailability)
- `risk-score`: An overall team risk score based on the number and severity of single points of failure

## Process

1. Scan each column (skill) of the matrix. Count the number of people at competent or expert.
2. Any skill with a count of 1 is a single point of failure. Any skill with a count of 0 is a gap (the team cannot perform this function reliably).
3. For each single point, estimate: how often is this skill needed (daily, weekly, monthly, rarely)? If the person is unavailable, what happens (work stops, quality drops, workaround exists)?
4. Rank the single points by: frequency times consequence. The daily-need, work-stops combination is the highest priority.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
