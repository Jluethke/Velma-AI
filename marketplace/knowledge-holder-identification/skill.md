# Knowledge Holder Identification

Identify the people who hold critical undocumented knowledge. They are not always the most senior people. They are the people others interrupt with questions because they know things that are not written down.

## Inputs

- `team-context`: Description of the team or organization and its key functions
- `knowledge-risk-areas`: Areas where losing a key person would cause the most disruption

## Outputs

- `knowledge-holder-map`: Map of knowledge holders: who holds what knowledge, how critical it is, and what would happen if they left tomorrow
- `interview-priority-list`: Prioritized list of who to interview first, based on knowledge criticality and departure risk

## Process

1. Ask each team: 'Who do you go to when you have a question that the documentation does not answer?' The names that come up repeatedly are the knowledge holders.
2. For each knowledge holder, map what they know that nobody else does. The test: if this person left tomorrow, what would break or slow down?
3. Assess the departure risk: are they likely to leave soon (retirement, career change, burnout)? Higher departure risk means higher extraction priority.
4. Rank by the product of criticality and departure risk. Interview the highest-ranked person first.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
