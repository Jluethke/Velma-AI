# Channel Monitoring Dashboard

Set up ongoing monitoring so saturation is caught early next time, not after months of wasted spend.

## Inputs

- `reallocation-plan`: The budget shift plan
- `channel-baseline-report`: Baseline CPA and volume for all channels

## Outputs

- `monitoring-dashboard-spec`: Dashboard design showing: CPA trend per channel, volume trend, saturation alerts, and reallocation triggers
- `alert-thresholds`: The specific thresholds that trigger a review: CPA rise of X% for Y consecutive periods, volume decline of Z%

## Process

1. Define the alert: CPA rises more than 15% month-over-month for 2 consecutive months triggers a review. Volume declines more than 20% month-over-month triggers a review.
2. Build the dashboard with one row per channel: current CPA, 3-month CPA trend, current volume, 3-month volume trend, health score (green/yellow/red).
3. Set the review cadence: monthly for all channels, weekly for any channel in yellow or red status.
4. Document the response playbook: when an alert fires, re-run the saturation diagnosis and alternative evaluation steps.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
