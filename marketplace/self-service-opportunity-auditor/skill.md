# Self Service Opportunity Auditor

Audit support requests to identify self-service opportunities.

## Inputs

- `ticket-history`: Historical support tickets
- `current-self-service`: Existing self-service options if any

## Outputs

- `self-service-candidates`: Requests that can be self-served
- `automation-potential`: Estimated ticket deflection per candidate

## Process

1. Categorize tickets by resolution type (information, action, troubleshooting).
2. Identify requests where the customer could resolve without agent help.
3. Estimate the deflection potential for each candidate.
4. Rank by volume and ease of self-service implementation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
