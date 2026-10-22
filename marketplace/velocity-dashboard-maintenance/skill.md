# Velocity Dashboard Maintenance

Maintain an ongoing velocity dashboard that flags categories before they become problems.

## Inputs

- `interventions`: The actions taken
- `velocity-table`: Current velocities

## Outputs

- `dashboard-design`: A monthly dashboard showing: each category's current spend, velocity, and 6-month projection, with red/yellow/green flags
- `review-cadence`: When to review the dashboard (monthly) and what triggers a deeper investigation

## Process

1. Build a simple monthly dashboard. For each category, show: current month spend, 3-month average velocity, and 6-month projected spend.
2. Color-code: green (velocity is 0% or negative), yellow (velocity is 1-5% per month), red (velocity is above 5% per month).
3. Review monthly. Focus only on yellow and red categories. Green categories are under control.
4. The dashboard takes 15 minutes per month to update and review. This small investment prevents expense surprises that take much more time and money to fix after the fact.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
