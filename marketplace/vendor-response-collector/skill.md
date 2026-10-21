# Vendor Response Collector

Collect vendor answers and supporting evidence, track outstanding items, and flag incomplete or inconsistent responses.

## Inputs

- `security-questionnaire`: The scoped question set issued to the vendor.
- `evidence-request-list`: The documents and artifacts requested alongside the questionnaire.

## Outputs

- `completed-responses`: Vendor answers keyed to each question with a status of complete, partial, or missing.
- `submitted-evidence`: Received documents linked to the questions they support, with gaps noted.

## Process

1. Issue the questionnaire and evidence request to the vendor contact with a due date.
2. Record each answer and attach submitted evidence to the question it supports.
3. Track outstanding questions and missing documents and send follow-up reminders.
4. Flag answers that conflict with the evidence or with other answers for later review.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
