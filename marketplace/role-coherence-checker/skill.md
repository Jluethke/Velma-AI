# Role Coherence Checker

Check whether one person can realistically produce all the outcomes. The most common job design failure is combining activities that require different modes of work (deep focus AND constant availability) or different skill sets (technical expertise AND sales ability). If the role requires two different people, split it.

## Inputs

- `activity-map`: Activities required for each outcome with time estimates
- `total-time-estimate`: Total weekly time required

## Outputs

- `coherence-assessment`: Whether the role is coherent (one person can do it) or needs to be split, with the specific conflicts identified
- `role-structure-recommendation`: If the role should be split: how to divide the outcomes across two roles so each is coherent

## Process

1. Check for mode conflicts: does the role require long blocks of uninterrupted focus AND constant availability for interruptions? If yes, one mode will always lose.
2. Check for skill conflicts: does the role require deep technical expertise AND high-touch relationship management? Very few people excel at both.
3. Check for time conflicts: do the activities for different outcomes need to happen at the same time? (e.g., two outcomes require presence in different meetings that overlap.)
4. If any conflict is found, recommend splitting the role. Define the split by outcomes, not by activities: each new role owns complete outcomes, not fragments.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
