# Secure Coding Verification

Verify that the codebase follows secure coding standards for the language and framework in use.

## Inputs

- `sast-findings`: Static analysis findings
- `manual-review-findings`: Manual review findings

## Outputs

- `coding-standard-gaps`: Deviations from secure coding standards
- `pattern-recommendations`: Recommended secure coding patterns to adopt

## Process

1. Check for use of parameterized queries vs string concatenation in database operations.
2. Verify output encoding in all rendering contexts (HTML, JavaScript, URL, CSS).
3. Check cryptographic implementations for known weak patterns (ECB mode, static IVs, weak hashing).
4. Verify that secrets are loaded from environment or vault, not hardcoded.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
