# Corrective Action Root Cause Finder

Identify and verify the root cause.

## Inputs

- `ca-record`: Corrective action record
- `containment-status`: Containment actions

## Outputs

- `verified-cause`: Root cause verified with data (D4)
- `escape-point`: Where the defect escaped detection

## Process

1. Identify all possible causes using structured tools (fishbone, 5 Why)
2. Test each candidate cause against the evidence
3. Verify the root cause: demonstrate it reproduces the problem and removing it prevents it (D4)
4. Identify the escape point: why did existing controls not catch it

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
