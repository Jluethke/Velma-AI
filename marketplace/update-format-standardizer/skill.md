# Update Format Standardizer

Design a consistent format so readers can scan the update in under 60 seconds. The format never changes. When the format changes, readers have to re-learn how to read it, and they stop reading.

## Inputs

- `content-spec-per-audience`: What each audience receives
- `update-schedule`: When updates go out

## Outputs

- `update-template`: The standard format: header, delta section, blockers section, outlook section, with character limits
- `format-rules`: Rules that keep the format consistent across writers and over time

## Process

1. Design the template: header (project name, date, one-line summary), delta (bulleted list of what changed), blockers (each with owner and needed action), outlook (on track, at risk, or off track with one sentence why).
2. Set character limits: total update under 300 words. Delta under 150 words. Each blocker in one sentence. Outlook in one sentence.
3. Write format rules: no attachments (link instead), no charts in the body (link to dashboards), no FYI items (those go in the self-service pointer).
4. Test readability: have someone scan the template in 30 seconds and tell you what is on track and what is blocked. If they cannot, simplify.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
