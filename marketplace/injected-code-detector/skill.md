# Injected Code Detector

Detect injected code, hollowed processes, and suspicious loaded modules.

## Inputs

- `process-list`: Enumerated processes and their modules
- `profiled-image`: The memory image for deep inspection

## Outputs

- `injection-findings`: Detected code injection, hollowing, and suspicious modules
- `extracted-samples`: Dumped suspicious code regions for further analysis

## Process

1. Compare in-memory code sections against on-disk originals
2. Detect VAD regions with execute permissions not backed by files
3. Identify process hollowing by checking PEB versus actual memory contents
4. Dump suspicious regions for offline analysis

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
