# Psm Data Collector

Collect and clean the survey responses, filtering out inconsistent or unusable data.

## Inputs

- `psm-survey`: The survey instrument
- `sample-plan`: The sampling approach

## Outputs

- `clean-responses`: Validated responses with the four price points per respondent, after removing inconsistent data
- `response-quality-report`: Number of total responses, number removed for quality issues, and the types of issues found

## Process

1. Distribute the survey and collect responses. Record the four price points from each respondent: too cheap, bargain, expensive, and too expensive.
2. Validate each response: the four prices must be in logical order (too cheap is less than or equal to bargain, bargain is less than or equal to expensive, expensive is less than or equal to too expensive). Remove any response where the order is violated.
3. Remove outliers: responses where any price is more than 3 standard deviations from the mean for that question. These are likely misunderstandings or bad-faith responses.
4. Verify sufficient sample size after cleaning. If more than 20% of responses were removed, the survey instrument may need revision (questions were confusing) or the sample was poorly targeted.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
