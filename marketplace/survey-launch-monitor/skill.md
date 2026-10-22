# Survey Launch Monitor

Launch the survey and monitor response rates, taking action if rates fall below target.

## Inputs

- `revised-survey`: The final survey instrument ready for launch
- `distribution-plan`: How the survey reaches respondents
- `success-criteria`: Target response rate and sample size

## Outputs

- `response-data`: The collected survey responses
- `response-rate-report`: Actual response rate versus target, by segment and channel

## Process

1. Deploy the survey through the selected distribution channels.
2. Monitor response rates daily against the target.
3. Send reminders at the scheduled intervals to non-respondents.
4. Close the survey when the target sample size is reached or the window ends.
5. Export the response data and generate the response rate report.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
