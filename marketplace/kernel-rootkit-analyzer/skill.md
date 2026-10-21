# Kernel Rootkit Analyzer

Analyze kernel structures for rootkit indicators and hook modifications.

## Inputs

- `profiled-image`: The memory image for kernel analysis
- `injection-findings`: User-mode injection results for correlation

## Outputs

- `rootkit-analysis`: Findings on kernel hooks, hidden objects, and DKOM
- `integrity-status`: Integrity assessment of kernel code and data structures

## Process

1. Check the SSDT and IDT for hooked entries
2. Scan for hidden processes using cross-reference of multiple listing methods
3. Detect Direct Kernel Object Manipulation (DKOM)
4. Verify kernel module integrity against known-good hashes

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
