# Segment Migration Tracker

Track how contacts move between behavioral segments over time, since communication preferences change with life events, job changes, and relationship deepening.

## Inputs

- `segment-playbooks`: Engagement strategies per segment
- `channel-switching-rules`: When to try a different channel

## Outputs

- `migration-patterns`: Common segment transitions (e.g., contacts often move from 'Fast Async' to 'Quarterly Sync' when they get promoted) and what triggers them
- `re-segmentation-schedule`: How often to recalculate behavioral profiles and reassign segments (quarterly for active contacts, annually for dormant)

## Process

1. Re-run behavioral profile extraction quarterly for active contacts. Compare the new profile to the previous segment assignment. If 2 or more primary dimensions changed, the contact has migrated to a new segment. Update their playbook accordingly.
2. Identify common migration triggers. Job change often shifts communication patterns (new email, different availability, new topics). Life events (new child, relocation) change response latency and channel preference. Relationship deepening moves people from formal channels (email) to informal ones (text, social media).
3. Build the migration alert: when a contact's behavior changes significantly (response time doubles, channel preference shifts, initiation pattern reverses), flag it for review. The change may indicate a life event worth acknowledging, a problem in the relationship worth addressing, or simply a natural evolution.
4. Track the aggregate migration rate: what percentage of your contacts change segments each quarter? A high rate (above 30%) means your segments are too narrow or your behavioral data is noisy. A low rate (below 5%) means your segments are stable and the playbooks are reliable. Target 10-20% quarterly migration as healthy.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
