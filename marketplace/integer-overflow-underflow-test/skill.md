# Integer Overflow Underflow Test

Test for integer overflow and underflow vulnerabilities in arithmetic operations.

## Inputs

- `vulnerability-candidates`: Functions with arithmetic operations
- `contract-source`: Source code for math operation review

## Outputs

- `overflow-findings`: Integer overflow and underflow vulnerabilities
- `math-safety-assessment`: Assessment of SafeMath usage and Solidity version protections

## Process

1. Identify all arithmetic operations and their input ranges
2. Check Solidity version for built-in overflow protection (0.8+)
3. Test unchecked blocks for intentional and unintentional overflow
4. Verify SafeMath or equivalent library usage in older compiler versions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
