# Newsletter Send Analyzer

Schedule the send, then analyze the performance after delivery.

## Inputs

- `approved-newsletter`: The approved newsletter
- `render-test-results`: Confirmation that rendering tests passed

## Outputs

- `send-confirmation`: Confirmation of send with timestamp and recipient count
- `newsletter-performance-report`: Performance report covering open rate, click rate, unsubscribe rate, and top-clicked links

## Process

1. Schedule the send for the optimal time based on audience data.
2. Monitor the initial delivery metrics (bounces, complaints).
3. After 48 hours, pull the open rate, click rate, click-to-open rate, and unsubscribe rate.
4. Identify the top-clicked links and most engaging sections.
5. Compile the performance report.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
