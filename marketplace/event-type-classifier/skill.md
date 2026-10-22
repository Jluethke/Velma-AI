# Event Type Classifier

Define event types and severity levels for the ledger.

## Inputs

- `operational-scope`: What operations the ledger covers
- `existing-events`: Known event types already occurring

## Outputs

- `event-taxonomy`: Classified list of event types with severity levels
- `severity-definitions`: What each severity level means and how to assign it

## Process

1. List all operational event types (incidents, changes, decisions, milestones, exceptions).
2. Define severity levels (informational, warning, error, critical).
3. Map each event type to its default severity.
4. Produce the event taxonomy and severity definitions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
