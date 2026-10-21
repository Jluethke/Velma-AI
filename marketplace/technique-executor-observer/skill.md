# Technique Executor Observer

Execute each ATT&CK technique while blue team observes in real time.

## Inputs

- `attack-plan`: Ordered list of techniques to execute
- `success-criteria`: Success criteria per technique

## Outputs

- `execution-log`: Log of each technique execution with timestamps, tools used, and outcome
- `blue-team-observations`: Blue team notes on what they observed for each technique

## Process

1. Execute each technique in the planned order using approved tools
2. Record the exact commands, tools, and timestamps for each execution
3. Blue team independently logs what alerts or indicators they observed
4. Pause between techniques to allow blue team to finish documentation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
