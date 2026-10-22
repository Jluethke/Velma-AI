# Decision Option Definer

Define the decision and the options. Each option must be stated as a specific action, not a vague direction. Include the status quo as an explicit option (doing nothing is a decision with its own consequences).

## Inputs

- `decision-description`: The decision to analyze
- `options-list`: The options being considered (include 'do nothing' as an explicit option)

## Outputs

- `defined-options`: Each option stated as a specific action with a clear scope
- `status-quo-option`: The 'do nothing' option and what continuing on the current path looks like

## Process

1. Write each option as a specific action: not 'expand' but 'hire 3 engineers and ship feature X by March'.
2. Include the status quo as option zero. State what happens if you change nothing.
3. Check that the options are mutually exclusive. If two can be done together, combine them into a new option.
4. Remove any option that is not actually available given current constraints.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
