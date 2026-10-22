# Growth Accounting Dashboard

Build the growth accounting dashboard and set the reporting cadence. This is the instrument panel for growth, not a one-time analysis.

## Inputs

- `primary-lever`: The lever to focus on
- `lever-impact-model`: Impact estimates per lever
- `growth-equation-table`: Growth decomposition data

## Outputs

- `dashboard-spec`: Dashboard layout: growth equation bar chart (new, resurrected, churned stacked per period), retention curves by cohort, and the primary lever metric with target
- `growth-accounting-report`: Complete growth accounting report with narrative, diagnosis, lever recommendation, and measurement plan

## Process

1. Build the dashboard with three views: (1) the growth equation stacked bar chart showing new, retained, resurrected, and churned per period, (2) retention curves by cohort, and (3) the primary lever metric tracked against the target.
2. Set the reporting cadence: weekly for the growth equation, monthly for the retention curves and lever metrics.
3. The dashboard replaces the vanity metric (topline active users or revenue) with the diagnostic metric (where growth comes from). Present this to anyone who asks 'are we growing?'
4. Re-run the lever analysis quarterly. The right lever changes as the business matures: early-stage companies pull acquisition. Growth-stage companies pull retention. Mature companies pull reactivation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
