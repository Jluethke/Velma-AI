# Current Behavior Comparison

Compare the failure list against your current behavior. Any overlap means you are already partially guaranteeing failure.

## Inputs

- `failure-methods`: All the ways to guarantee failure
- `categorized-failures`: Failures by category

## Outputs

- `overlap-list`: Failure methods that partially describe current behavior (things you are already doing that would guarantee failure)
- `severity-ranking`: The overlaps ranked by how closely your current behavior matches the failure method

## Process

1. Take each failure method and honestly ask: are we doing any version of this right now? Most teams will find 3-5 items on the failure list that they are partially doing.
2. Rate the severity of each overlap: 'fully doing this' (high severity), 'sometimes doing this' (medium), 'slightly doing this' (low).
3. The high-severity overlaps are emergencies. You are actively driving toward the failure you want to avoid.
4. This is the core value of inversion: it reveals problems you are blind to when thinking positively. 'How do we retain customers?' might produce generic answers. 'We are currently responding to support tickets in 4 days, which is one of our guaranteed failure methods' is specific and actionable.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
