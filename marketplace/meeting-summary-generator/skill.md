# Meeting Summary Generator

Generate the meeting summary with decisions, action items, and key discussion points.

## Inputs

- `raw-transcript`: Timestamped transcript with speaker labels
- `participant-list`: List of meeting participants

## Outputs

- `meeting-summary`: Summary: agenda topics covered, key decisions, action items with owners and deadlines
- `meeting-record`: Complete meeting record (full transcript, summary, action items, attendance)

## Process

1. Extract the agenda topics discussed and summarize each one.
2. Identify decisions made and who made them.
3. Extract action items with assigned owner and deadline.
4. Compile the meeting record with full transcript, summary, and action items.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
