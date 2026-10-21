# Static Vuln Analysis

Perform static analysis to identify vulnerability classes in the binary.

## Inputs

- `target-binary`: Target binary
- `protection-profile`: Known protections

## Outputs

- `static-findings`: Potential vulnerabilities found by static analysis
- `function-map`: Map of interesting functions and call graph

## Process

1. Disassemble and decompile the binary
2. Search for dangerous function calls: strcpy, sprintf, gets, memcpy without bounds
3. Identify user-controlled input paths to dangerous sinks
4. Map the call graph around high-risk functions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
