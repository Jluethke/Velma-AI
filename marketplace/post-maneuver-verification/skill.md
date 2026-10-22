# Post Maneuver Verification

Confirm the new orbit by tracking, verify the risk is cleared, and document the event.

## Inputs

- `avoidance_maneuver`: Executed burn to verify.
- `post_maneuver_ephemeris`: Predicted post-burn orbit to confirm against tracking.

## Outputs

- `verification_report`: Confirmation that the probability is below threshold after the maneuver.
- `updated_screening`: Fresh screening of the new orbit against the catalog.

## Process

1. Confirm the achieved orbit from onboard navigation or ground tracking and compare it with the planned post-maneuver orbit.
2. Re-run the conjunction screening on the updated orbit and recompute the probability for the original event.
3. Verify the probability is now below the action threshold and that no new high-probability conjunction was introduced.
4. Record the event, the decision, the maneuver, and the outcome for the operations log and for trending of conjunction rates.
5. Notify affected stakeholders and the tracking provider of the maneuver so their catalogs stay consistent.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
