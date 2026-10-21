# Multi Engine Scanner

Scan the system with multiple detection engines for known malware signatures.

## Inputs

- `target-system`: The system to scan
- `volatile-data`: Running process data to guide targeted scanning

## Outputs

- `scan-results`: Detection results from each scanning engine
- `flagged-files`: Files flagged by one or more engines with detection names

## Process

1. Run at least two independent antimalware engines on the full filesystem
2. Scan running process memory for in-memory-only malware
3. Submit hashes of suspicious files to multi-engine services
4. Compile results noting which engines detected which files

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
