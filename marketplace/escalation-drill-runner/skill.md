# Escalation Drill Runner

Test the escalation path with a drill. An untested escalation path fails at the worst possible moment because someone's phone number changed, someone's authority was revoked, or someone assumed someone else would act.

## Inputs

- `receiver-map`: The escalation receivers to test
- `template-set`: The templates to use during the drill
- `skip-level-path`: The emergency bypass to test

## Outputs

- `drill-results`: What worked, what failed, response times measured against targets
- `path-revisions`: Specific changes to the escalation path based on drill findings

## Process

1. Schedule the drill. Warn participants that a drill will happen this week but not when. (Fully unannounced drills test the path. Pre-announced drills test nothing.)
2. Trigger a simulated Level 2 escalation using the template. Measure: time to first response, time to correct receiver, time to resolution action.
3. Test the skip-level path separately with a simulated Level 1. Measure: did the skip-level contact respond within 15 minutes?
4. After the drill, compare actual response times to targets. Every gap is a revision. Update contact info, authority grants, and templates.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
