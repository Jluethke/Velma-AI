# Catastrophe Response Monitor

Monitor the catastrophe response metrics and produce the event report.

## Inputs

- `triaged-claims`: Claims triage data and status
- `emergency-payments`: Emergency payment data

## Outputs

- `response-metrics`: Dashboard of response metrics (claims received, inspected, closed, open, cycle time, customer satisfaction)
- `catastrophe-response-report`: Complete event response report with timeline, metrics, lessons learned, and reserve summary

## Process

1. Track response metrics daily: claims received, inspected, settled, and open.
2. Monitor adjuster productivity and customer wait times.
3. Update the aggregate reserve estimate as claim data matures.
4. Compile the final event report with timeline, total incurred, and lessons learned.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
