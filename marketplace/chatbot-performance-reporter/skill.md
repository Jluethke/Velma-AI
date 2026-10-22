# Chatbot Performance Reporter

Measure chatbot containment rate and produce the design document.

## Inputs

- `test-results`: Conversation test results
- `training-set`: Finalized training utterances

## Outputs

- `chatbot-design-document`: Complete chatbot design with flows, training data, and performance targets
- `containment-baseline`: Expected containment rate based on testing

## Process

1. Calculate the containment rate (conversations resolved without human handoff).
2. Document the expected performance by intent.
3. Package the design, training data, and test results.
4. Produce the chatbot design document.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
