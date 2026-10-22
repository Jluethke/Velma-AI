# Automation Decision Record

Record the automate-or-not decision with the numbers and the reasoning so it can be revisited when frequency or cost changes. A decision without its basis gets relitigated from scratch every time someone asks.

## Inputs

- `adjusted-verdict`: The adjusted verdict
- `judgment-risk-notes`: Judgment considerations

## Outputs

- `automation-decision`: The final automate or do-not-automate decision
- `decision-rationale`: The numbers and reasoning behind the decision

## Process

1. State the decision plainly as automate or do not automate.
2. Attach the manual cost, build, maintenance, payback, and adjustment behind it.
3. Name the condition that would flip the decision, such as a change in frequency or cost.
4. Set a re-check trigger so the decision is revisited when that condition changes.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
