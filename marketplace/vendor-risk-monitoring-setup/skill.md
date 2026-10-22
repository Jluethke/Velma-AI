# Vendor Risk Monitoring Setup

Set up ongoing monitoring for vendor concentration risk so that new concentrations are caught early.

## Inputs

- `diversification-plan`: The mitigation plan being executed
- `vendor-concentration-table`: The current vendor map

## Outputs

- `monitoring-dashboard`: The metrics to track: concentration percentage per function, vendor financial health indicators, service quality scores, and contract renewal dates
- `vendor-audit-schedule`: The annual audit schedule with the checklist for each review

## Process

1. Define the metrics: concentration percentage per critical function (updated quarterly), vendor financial health (annual credit check or financial statement review), service quality (quarterly SLA review), and contract renewal timeline.
2. Set the alert thresholds: any function crossing 70% concentration triggers a review. Any vendor showing financial distress triggers an accelerated diversification plan.
3. Schedule the annual audit: re-run the full concentration analysis, update the switching cost estimates, and review the diversification progress.
4. Add new vendors to the map as they are onboarded. Remove vendors as they are offboarded. The map must reflect reality, not the last audit.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
