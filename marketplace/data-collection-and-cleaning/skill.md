# Data Collection And Cleaning

Collect the survey responses and clean the data by removing invalid or inconsistent responses.

## Inputs

- `survey-instrument`: The survey to distribute
- `sample-plan`: How many responses and from whom

## Outputs

- `clean-responses`: Valid responses with all four price points per respondent
- `response-count`: Number of valid responses after cleaning

## Process

1. Distribute the survey through the planned channels. Allow 1-2 weeks for collection.
2. Remove responses where the price points are logically inconsistent: 'too cheap' must be less than 'bargain,' which must be less than 'expensive,' which must be less than 'too expensive.' Inconsistent responses indicate the respondent did not understand the questions.
3. Remove responses from people who failed the screening question or who completed the survey in under 30 seconds (indicating they did not read the product description).
4. Record the final count of valid responses. If below 30, the results are directional only, not statistically reliable.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
