# Matter Intake Receiver

Receive and log the incoming legal matter request with initial details.

## Inputs

- `matter-request`: Description of the legal matter or request form
- `requesting-party`: Person or department requesting legal assistance

## Outputs

- `matter-summary`: Structured summary of the matter request
- `matter-type`: Classification of the matter (contract, employment, litigation, regulatory, IP)

## Process

1. Extract the key facts from the matter request: parties, subject, urgency, and relevant dates.
2. Classify the matter by type (contract, employment, litigation, regulatory, IP, or other).
3. Summarize the request in a structured format suitable for opening a matter file.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
