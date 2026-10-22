# Five Whys Causal Chain

Build the causal chain by asking why the symptom happens, then why that happens, down to the point where the next why leaves the span of control. Each answer must be a cause that, if removed, would stop the one above it.

## Inputs

- `symptom-statement`: The observable symptom to trace
- `occurrence-evidence`: How often the symptom occurs

## Outputs

- `causal-chain`: Ordered chain of causes from symptom down to root
- `root-cause-candidates`: The lowest causes that still sit inside the span of control

## Process

1. Ask why the symptom happens and write a cause that would, if removed, stop the symptom.
2. Ask why that cause happens and repeat, keeping each link a true cause rather than a restatement of the one above.
3. Stop when the next why leaves your span of control or when answers start to loop.
4. Mark the one or two lowest causes still inside your control as root-cause candidates.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
