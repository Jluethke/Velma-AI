# Client Inquiry Intake

Receive and qualify an inbound client inquiry.

## Inputs

- `inquiry-details`: The client's message, form submission, or referral context
- `service-offerings`: List of services offered with pricing ranges

## Outputs

- `inquiry-summary`: Structured summary of what the client needs
- `qualification-score`: Fit assessment based on budget, timeline, and scope

## Process

1. Extract the client's name, company, project description, budget range, and timeline from the inquiry.
2. Score the inquiry against your qualification criteria (budget fit, scope match, availability, strategic interest).
3. If the inquiry passes the threshold, draft a response proposing a discovery call with available times.
4. If it does not pass, draft a polite decline with a referral suggestion.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
