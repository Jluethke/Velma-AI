# Prototype Pollution Input Scan

Identify user-controlled object merging or property assignment operations in the application.

## Inputs

- `target-application`: Target application URL
- `source-access`: Level of source code access (black box, gray box, white box)

## Outputs

- `merge-operations`: Object merge and deep-copy operations found
- `input-vectors`: Input vectors that reach merge operations

## Process

1. Identify endpoints accepting nested JSON objects
2. Locate object merge, deep copy, and property assignment operations
3. Map user input paths that reach these operations

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
