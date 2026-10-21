# Finding Deduplication Merge

Deduplicate and merge related findings that share root causes or affect the same component.

## Inputs

- `scored-findings`: Scored findings to deduplicate
- `finding-count-summary`: Category counts for merge candidates

## Outputs

- `deduplicated-findings`: Merged and deduplicated finding set
- `root-cause-map`: Map of root causes to their manifestations

## Process

1. Identify findings that share the same root cause vulnerability
2. Merge related findings under a single entry with multiple affected locations
3. Preserve the highest severity score when merging
4. Document the root cause relationship for remediation efficiency

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
