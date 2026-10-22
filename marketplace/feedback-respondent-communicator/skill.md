# Feedback Respondent Communicator

Communicate back to the respondent what was done about their feedback.

## Inputs

- `resolution-status`: Status and outcome of each feedback item
- `categorized-feedback`: Original feedback with respondent contact info

## Outputs

- `closure-messages`: Messages sent to respondents about their feedback outcome
- `closure-satisfaction`: Respondent satisfaction with how their feedback was handled

## Process

1. Draft a personalized response for each resolved item describing what was done.
2. Send the closure message through the original channel when possible.
3. Include a short satisfaction question (was this helpful, yes or no).
4. Log the closure and any follow-up response from the respondent.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
