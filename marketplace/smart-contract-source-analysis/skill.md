# Smart Contract Source Analysis

Analyze smart contract source code for security patterns, code quality, and known vulnerability signatures.

## Inputs

- `contract-source`: Smart contract source code (Solidity, Vyper, or other)
- `deployment-config`: Deployment parameters (network, compiler version, optimizer settings)
- `contract-specification`: Intended behavior specification and invariants

## Outputs

- `source-analysis-report`: Code quality and pattern analysis results
- `vulnerability-candidates`: Potential vulnerabilities identified for manual verification

## Process

1. Run static analysis tools (Slither, Mythril, Securify) on the source code
2. Review code patterns against known vulnerability databases
3. Check compiler version and optimizer settings for known issues
4. Identify high-risk functions (external calls, state changes, math operations)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
