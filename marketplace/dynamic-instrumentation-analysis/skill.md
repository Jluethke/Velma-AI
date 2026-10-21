# Dynamic Instrumentation Analysis

Run dynamic analysis with instrumentation to detect runtime vulnerabilities.

## Inputs

- `target-binary`: Target binary
- `static-findings`: Candidate vulnerabilities to probe

## Outputs

- `dynamic-findings`: Vulnerabilities confirmed through runtime analysis
- `crash-data`: Crash dumps and execution traces

## Process

1. Instrument with AddressSanitizer, Valgrind, or equivalent
2. Exercise input paths identified in static analysis
3. Fuzz the binary with coverage-guided tools
4. Collect crash dumps and execution traces

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
