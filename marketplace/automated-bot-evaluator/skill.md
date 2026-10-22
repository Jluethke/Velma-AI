# Automated Bot Evaluator

Run automated intent recognition and dialog completion tests.

## Inputs

- `test-scenarios`: Test scenarios
- `test-utterances`: Test utterances with expected matches

## Outputs

- `automated-test-results`: Intent recognition accuracy, entity extraction accuracy, and dialog completion rates
- `confusion-matrix`: Confusion matrix showing which intents are misclassified and to what

## Process

1. Run each test utterance through the bot and record the matched intent and extracted entities.
2. Compare against expected values and calculate intent accuracy and entity extraction accuracy.
3. Generate the confusion matrix to identify systematic misclassifications.
4. Flag intents with accuracy below the threshold for retraining.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
