# Log Entry Schema Designer

Design the minimum viable log entry that captures enough context for future retrieval without being so burdensome that you stop logging.

## Inputs

- `interaction-channels`: The channels through which you interact with contacts (email, phone, text, in-person, video call, social media, etc.)
- `retrieval-use-cases`: What you need to recall before an interaction (what you last discussed, what they asked for, what you promised, their current priorities)

## Outputs

- `log-entry-schema`: The fields for each log entry: date, channel, contact, topic, their-state, promises-made, next-action, and how long each should take to fill
- `channel-specific-adapters`: How the schema maps to each channel (email logs can be partially automated, phone calls need manual entry, in-person needs voice notes)

## Process

1. Define 7 fields. Date (automatic). Channel (pick from list). Contact (pick from contacts). Topic (one sentence: what you discussed, not a transcript). Their-state (one phrase: what they seem focused on, worried about, or excited about right now). Promises-made (anything you said you would do). Next-action (the single next thing to do with this contact).
2. Set a time budget: each log entry should take under 60 seconds to complete. If it takes longer, you will stop doing it within a week. The their-state and promises-made fields are the most valuable and the easiest to forget, so those are mandatory. Topic and next-action can be 3-word summaries.
3. Design channel adapters. Email: extract topic and promises from the email itself (can be partially automated with search). Phone/video: log immediately after hanging up (even a voice memo you transcribe later). In-person: use a quick note on your phone during or immediately after. Social media: only log if the interaction was substantive (a comment thread counts, a like does not).
4. Define the 'skip log' criteria: not every interaction needs a log entry. Routine pleasantries, group broadcasts, and auto-generated messages get skipped. The rule: log it if future-you would want to know it happened. If you would not reference it in your next conversation with this person, skip it.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
