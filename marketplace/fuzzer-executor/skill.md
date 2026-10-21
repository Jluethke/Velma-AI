# Fuzzer Executor

Run the fuzzer with coverage instrumentation and collect results.

## Inputs

- `harness-source`: Fuzz harness source code
- `seed-corpus`: Directory of seed inputs

## Outputs

- `crash-corpus`: All inputs that triggered crashes, hangs, or sanitizer violations
- `coverage-report`: Code coverage achieved during the fuzzing campaign

## Process

1. Compile the harness with sanitizers and coverage instrumentation.
2. Run the fuzzer for the target duration, monitoring for crashes and coverage growth.
3. Collect all crash-inducing inputs and the final coverage report.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
