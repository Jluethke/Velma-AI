# Dark Web Impact Assessor

Assess the impact of validated dark web findings to the organization and determine response actions.

## Inputs

- `validated-alerts`: Confirmed findings from triage
- `organization-profile`: Organizational context for impact assessment

## Outputs

- `impact-assessment`: Business impact and risk rating for each finding
- `response-actions`: Recommended actions (password resets, takedowns, threat briefings)

## Process

1. For credential leaks: determine scope (how many accounts, which systems, how recent)
2. For threat actor mentions: assess capability and intent
3. For data exposure: identify the data type and sensitivity level
4. Recommend specific response actions for each finding

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
