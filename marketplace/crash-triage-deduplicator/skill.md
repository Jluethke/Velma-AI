# Crash Triage Deduplicator

Triage and deduplicate crashes to identify unique bugs.

## Inputs

- `crash-corpus`: All inputs that triggered crashes
- `harness-source`: Fuzz harness source code for reproduction

## Outputs

- `unique-bugs`: Deduplicated list of unique bugs with minimal reproducer inputs
- `bug-classifications`: Each bug classified by type (buffer overflow, use-after-free, null deref, etc.)

## Process

1. Group crashes by stack trace and sanitizer report.
2. Minimize each reproducer input to the smallest input that still triggers the crash.
3. Classify each unique bug by vulnerability type and assess exploitability.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
