# Failure Path Enumeration

Enumerate every path to guaranteed failure. Be thorough and creative. Include obvious paths (ignore the market, run out of money) and non-obvious ones (hire people who agree with you, optimize the wrong metric). The value of inversion is in the non-obvious paths.

## Inputs

- `inverted-question`: The inverted question: how to guarantee failure
- `context`: Constraints and context

## Outputs

- `failure-paths`: Complete list of ways to guarantee failure, from obvious to non-obvious
- `non-obvious-paths`: The subset of failure paths that would not appear in a forward-only analysis

## Process

1. Start with the obvious: what would make failure certain? List at least 5 obvious paths.
2. Now go deeper: what subtle decisions, if made consistently, would ensure failure over time? List at least 5 non-obvious paths.
3. Check each path for specificity. 'Bad communication' is too vague. 'Never telling the team what changed and why' is specific.
4. Include paths from different categories: people, process, market, timing, resources, incentives, measurement.
5. Mark which paths are non-obvious (would not appear in a typical brainstorm about how to succeed).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
