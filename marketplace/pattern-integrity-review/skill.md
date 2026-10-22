# Pattern Integrity Review

Review the log to confirm the never miss twice rule is holding and adjust the protocol where double misses still slip through.

## Inputs

- `miss-log`: The record of completed, recovery, and miss days
- `recovery-action-plan`: The recovery execution plan

## Outputs

- `pattern-integrity-report`: A summary of how often the rule held and how quickly recoveries happened
- `protocol-adjustment`: Changes to the recovery version, triggers, or habit size where double misses occurred

## Process

1. Count the double misses. Zero or very few means the protocol is holding. Several means the recovery version is still too large or the trigger is unreliable.
2. Check how fast recoveries happened. A miss followed immediately by a recovery day is the intended pattern. A miss followed by another miss needs a smaller recovery version.
3. For any cluster of double misses, trace the cause. A recurring hard day may need its own smaller default rather than relying on recovery after the fact.
4. Adjust the smallest lever that fixes it. Usually shrinking the recovery version or fixing its trigger restores the pattern without touching the main habit.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
