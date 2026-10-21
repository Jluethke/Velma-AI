# Code Security Report

Produce the source code security review report with all findings, code locations, and fix guidance.

## Inputs

- `sast-findings`: Static analysis findings
- `logic-flaw-findings`: Business logic findings
- `dependency-vulnerabilities`: Dependency CVE findings

## Outputs

- `code-security-report`: Complete source code security review report
- `fix-priority-list`: Prioritized list of fixes with code-level guidance

## Process

1. Consolidate all findings with file paths, line numbers, and severity ratings.
2. Write fix guidance with before/after code examples for each finding category.
3. Produce a summary of systemic issues vs one-off findings.
4. Recommend process improvements (linting rules, pre-commit hooks) to prevent recurrence.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
