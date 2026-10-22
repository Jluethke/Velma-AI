# Process Instance Logger

Log real instances of the process as they happen. Use timestamps, not descriptions. The log must capture what actually happened, not what should have happened.

## Inputs

- `process-name`: The process to mine
- `sample-size`: Number of instances to observe (minimum 10 for pattern detection)

## Outputs

- `instance-logs`: Timestamped log of each observed instance: every action, decision, wait, rework, and workaround
- `observation-notes`: Anything the observer noticed that the timestamps alone do not capture (frustration, confusion, shortcuts)

## Process

1. For each instance, record the start time and every subsequent action with its timestamp.
2. Record decisions: where the performer chose between options, what they chose, and why.
3. Record rework: any point where work went backward to a previous step.
4. Record workarounds: any action not in the official process that the performer took to get the job done.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
