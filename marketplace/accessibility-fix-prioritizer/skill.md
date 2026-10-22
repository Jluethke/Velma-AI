# Accessibility Fix Prioritizer

Prioritize all findings by impact and effort, and produce the audit report.

## Inputs

- `automated-findings`: Automated scan results
- `keyboard-findings`: Keyboard navigation issues
- `screen-reader-findings`: Screen reader issues
- `aria-issues`: ARIA attribute issues

## Outputs

- `prioritized-fixes`: All issues ranked by impact and effort
- `accessibility-audit-report`: Complete accessibility audit report with findings, recommendations, and remediation plan

## Process

1. Combine all findings from automated, keyboard, and screen reader testing.
2. Rate each issue by user impact (how many users affected, how severely) and fix effort.
3. Group fixes into immediate (critical blockers), short-term (serious issues), and long-term (moderate and minor).
4. Compile the audit report with findings, WCAG references, and a remediation timeline.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
