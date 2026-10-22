# Sharing Opportunity Audit

Identify the existing workflows where knowledge is created but not captured. Every meeting, review, incident, and project close generates knowledge that evaporates unless someone writes it down.

## Inputs

- `team-workflows`: Description of the team's regular workflows: meetings, reviews, releases, incidents, project milestones
- `current-sharing-methods`: How knowledge is currently shared (if at all): wiki, Slack, email, word of mouth, tribal knowledge

## Outputs

- `sharing-opportunity-map`: Map of existing workflows to the knowledge they produce and whether it is currently captured or lost
- `highest-value-sharing-points`: Top 5 workflow points where adding a capture step would produce the most value for the least effort

## Process

1. Walk through each regular workflow: standup, code review, sprint retro, incident response, project kickoff, project close, customer call, sales demo, support ticket resolution.
2. For each workflow, ask: what knowledge is produced here? Who has it after the workflow completes? Is it written down anywhere? If the person who has it leaves, is the knowledge gone?
3. Rank the sharing opportunities by: value (how important is this knowledge?), perishability (how quickly does it become stale?), and effort to capture (how much extra work to write it down?).
4. Select the top 5 opportunities where the value-to-effort ratio is highest. These are the points where sharing will be embedded first.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
