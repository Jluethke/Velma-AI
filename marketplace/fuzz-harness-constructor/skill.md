# Fuzz Harness Constructor

Construct the fuzz harness and instrumentation that feeds inputs to each selected target.

## Inputs

- `fuzz-targets`: Functions and parsers selected as fuzz targets
- `input-interfaces`: Interfaces that accept external or untrusted input

## Outputs

- `harness-code`: Harness entry points that drive each fuzz target
- `instrumentation-config`: Coverage and sanitizer instrumentation settings

## Process

1. Write a harness entry point that maps fuzzer bytes to target inputs
2. Isolate the target so each run starts from a clean state
3. Enable coverage feedback and memory or undefined-behavior sanitizers
4. Verify the harness drives the target before any campaign

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
