# Retrieval Workflow Builder

Build the retrieval workflow so you can prep for any interaction in under 2 minutes by pulling the right context at the right time.

## Inputs

- `log-entry-schema`: The fields for each log entry
- `channel-specific-adapters`: How logging works per channel

## Outputs

- `prep-card-template`: A one-page prep card that summarizes everything you need before talking to someone: last 3 interactions, open promises, their current state, suggested talking points
- `retrieval-triggers`: When prep cards should be generated (before scheduled meetings, when a contact reaches out, when a follow-up is due)

## Process

1. Design the prep card: a single view with 4 sections. (1) Last 3 interactions: date, channel, topic (one line each). (2) Open promises: anything you said you would do that is not yet done. (3) Their state: the most recent their-state entry. (4) Suggested talking point: based on their interests and your content bank, one specific thing to bring up.
2. Set the 2-minute rule: the prep card must be generated and readable in under 2 minutes. This means pre-computation (promises flagged as open/closed, interactions sorted by recency) rather than searching through raw logs at prep time.
3. Define retrieval triggers: generate a prep card automatically before any scheduled meeting (calendar integration), when a contact initiates an unexpected message (inbox integration), and when a follow-up cadence fires. The prep card should appear without you asking for it.
4. Build the promise-tracking layer: every promise-made entry stays open until you explicitly close it. The prep card shows open promises in red. An unclosed promise from 90 days ago is a credibility problem that should be visible every time you interact with that contact.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
