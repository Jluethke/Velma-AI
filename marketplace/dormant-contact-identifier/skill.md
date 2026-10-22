# Dormant Contact Identifier

Identify all contacts that meet the dormancy criteria and pull their interaction histories for scoring.

## Inputs

- `contact-database`: All contacts with interaction history
- `dormancy-threshold`: Number of days without interaction that qualifies as dormant (default: 90 days for active-stage contacts, 180 for trusted)

## Outputs

- `dormant-list`: All contacts meeting the dormancy threshold with their last interaction date and former lifecycle stage
- `interaction-summaries`: For each dormant contact, a summary of the last 5 interactions before they went quiet

## Process

1. Query all contacts where last_interaction_date is older than the dormancy threshold for their lifecycle stage. Trusted contacts get a longer threshold because high-trust relationships sustain longer periods of silence without actually decaying.
2. For each dormant contact, pull the last 5 interactions and summarize: what were you discussing, was there an unresolved thread, did one of you make a promise that was not fulfilled? An unfulfilled promise is often the reason someone went quiet.
3. Exclude intentionally parked contacts (you chose to let these go dormant) and contacts marked as lost (they already went through a reactivation attempt or explicitly disengaged).
4. Sort the dormant list by days-since-last-interaction ascending. The most recently dormant contacts are easiest to reactivate (the relationship is still warm in their mind). The longest-dormant contacts may not remember who you are.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
