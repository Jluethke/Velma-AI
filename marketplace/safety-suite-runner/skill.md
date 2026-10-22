# Safety Suite Runner

Execute the safety evaluation suite and collect results.

## Inputs

- `test-suite`: Test cases to run
- `adversarial-prompts`: Adversarial inputs

## Outputs

- `raw-results`: Outputs for every test case
- `failure-log`: Cases where the system failed

## Process

1. Run each test case against the system.
2. Record the system output and any safety violations.
3. Flag outputs that score below the threshold.
4. Log all failures with their category and severity.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
