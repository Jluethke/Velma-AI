# Risk Specificity Filter

Force each risk into a specific, testable statement. Vague risks cannot be managed.

## Inputs

- `raw-risk-list`: The unfiltered list of risk causes from the pre-mortem
- `scope-description`: What you are protecting

## Outputs

- `specific-risk-statements`: Each risk rewritten as a specific, testable statement with a named trigger event and a measurable consequence
- `discarded-vague-risks`: Risks that could not be made specific enough to act on, noted for later revisit

## Process

1. For each risk, rewrite it in the form: '[specific trigger event] causes [measurable consequence] within [time frame].' If you cannot fill all three slots, the risk is too vague.
2. Test each statement: could two people independently agree on whether this risk has materialized? If not, sharpen the trigger event.
3. Set aside risks that remain vague after two attempts. They may indicate a knowledge gap worth investigating separately.
4. Group related risks that share a common root cause, but keep each as a separate register entry.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
