# Bounty Scope Definer

Define the program scope and rules of engagement for bug bounty hunters.

## Inputs

- `asset-inventory`: Inventory of assets (domains, APIs, mobile apps) to include
- `risk-tolerance`: Organization risk tolerance and testing constraints

## Outputs

- `program-scope`: Defined in-scope and out-of-scope assets and test types
- `rules-of-engagement`: Rules researchers must follow during testing

## Process

1. Classify each asset by criticality and readiness for external testing
2. Define in-scope targets (URLs, IP ranges, mobile apps) and explicitly list out-of-scope items
3. Write rules of engagement covering prohibited actions (DoS, social engineering, data exfiltration)
4. Define safe harbor language protecting researchers who follow the rules

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
