# Crash Triage Analyzer

Triage crashing inputs into unique root causes and assess their exploitability.

## Inputs

- `crash-artifacts`: Crashing inputs and their reproduction data
- `harness-code`: Harness entry points that drive each fuzz target

## Outputs

- `triaged-crashes`: Crashes deduplicated by root cause with repro steps
- `exploitability-assessment`: Severity and exploitability rating per root cause

## Process

1. Reproduce each crash and deduplicate by stack and faulting condition
2. Minimize each crashing input to its smallest reproducer
3. Classify the fault type and assess exploitability and severity
4. Package each unique crash with repro steps for the owning team

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
