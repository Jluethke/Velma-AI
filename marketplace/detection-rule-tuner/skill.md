# Detection Rule Tuner

Tune existing detection rules and create new rules to close identified gaps.

## Inputs

- `gap-analysis`: Root cause analysis of detection gaps
- `missing-data-sources`: Data sources needed to close gaps

## Outputs

- `tuned-rules`: List of rules tuned with before and after configurations
- `new-rules`: New detection rules created to cover previously missed techniques

## Process

1. Tune existing rules that produced false negatives by adjusting thresholds or logic
2. Write new detection rules for techniques where no rule existed
3. Prioritize rule creation by kill chain position (prefer early detection)
4. Document each rule change with rationale

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
