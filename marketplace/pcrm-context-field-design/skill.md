# Pcrm Context Field Design

Define the small set of context fields the system will track for each contact, so that before any interaction you can recall what you last discussed, what matters to them, and what you promised. The field set is deliberately short so that keeping it current stays realistic.

## Inputs

- `tiered-roster`: Contacts sorted into Dunbar tiers
- `tier-overflow-flags`: Tiers over target size and what that signals

## Outputs

- `context-field-schema`: The fields tracked per contact: last contact date, what you last discussed, what matters to them, what you promised, next action
- `field-fill-priority`: Which fields to fill first by tier, so inner tiers get full context and outer tiers get the minimum

## Process

1. Define five fields and stop there. Last-contact-date, last-topic (one line on what you discussed), what-matters (what this person cares about or is working toward right now), open-promise (anything you said you would do), and next-action (the single next thing to do with them).
2. Set the rule that what-matters and open-promise are the two fields that actually change behavior, so they are mandatory for the inner 5 and close 15. For acquaintances, last-contact-date alone is enough to run the cadence.
3. Write a one-line example for each field so future entries stay consistent. Last-topic is not a transcript, it is a phrase like talked through their job search, not the whole conversation.
4. Decide the update trigger: fields get refreshed right after an interaction while it is fresh, not in a weekly batch, because the detail you want (what mattered to them that day) is gone by the weekend.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
