# Business Logic Flaw Testing

Test for business logic vulnerabilities that bypass security through legitimate application flows used in unintended sequences.

## Inputs

- `manual-review-findings`: Manual review findings
- `application-context`: Application purpose and expected workflows

## Outputs

- `logic-flaw-findings`: Business logic vulnerabilities found
- `abuse-case-descriptions`: Step-by-step abuse cases for each logic flaw

## Process

1. Identify state machines and multi-step workflows in the application.
2. Test for step-skipping, parameter tampering, and race conditions in workflows.
3. Check for price manipulation, quantity overflow, and discount stacking in e-commerce flows.
4. Verify that business rules are enforced server-side, not only client-side.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
