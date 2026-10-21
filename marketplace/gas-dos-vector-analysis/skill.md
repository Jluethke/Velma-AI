# Gas Dos Vector Analysis

Analyze gas optimization and denial-of-service vectors including unbounded loops and block gas limits.

## Inputs

- `contract-source`: Source code for gas analysis
- `source-analysis-report`: Functions with complex logic

## Outputs

- `gas-dos-findings`: Gas-based denial-of-service vulnerabilities
- `gas-optimization-notes`: Gas optimization recommendations

## Process

1. Identify loops that iterate over unbounded arrays or mappings
2. Test for functions that can exceed block gas limit with large inputs
3. Check for griefing vectors where an attacker can force high gas costs on others
4. Analyze storage patterns for gas efficiency and DoS resistance

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
