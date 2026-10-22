# Role Survey Matcher

Match internal roles to survey benchmark positions.

## Inputs

- `roles-to-benchmark`: Internal roles
- `market-data`: Survey data

## Outputs

- `matched-roles`: Internal roles mapped to survey positions
- `match-quality`: Confidence level of each match

## Process

1. Compare internal job descriptions to survey position descriptions
2. Select the closest match for each role
3. Rate the match quality (strong, moderate, weak)
4. Document any roles that lack a good survey match

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
