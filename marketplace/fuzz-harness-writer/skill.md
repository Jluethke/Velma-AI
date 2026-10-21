# Fuzz Harness Writer

Write the fuzz harness that feeds generated inputs to the target function.

## Inputs

- `fuzz-targets`: List of functions to fuzz with their signatures and input formats
- `target-codebase`: Source code of the target

## Outputs

- `harness-source`: Fuzz harness source code compatible with the selected engine (libFuzzer, AFL, Honggfuzz)
- `build-instructions`: Instructions to compile the harness with sanitizers and coverage instrumentation

## Process

1. Select the fuzzing engine based on the target language and platform.
2. Write the harness entry point that deserializes fuzzer input and calls the target function.
3. Add sanitizer flags (ASan, MSan, UBSan) and coverage instrumentation to the build.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
