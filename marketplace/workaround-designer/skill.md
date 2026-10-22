# Workaround Designer

Design a workaround for each of the top single dependencies. The workaround must be executable by someone who has never done it before, using only resources currently available.

## Inputs

- `most-fragile-dependencies`: The top single dependencies to address
- `dependency-tree`: The full dependency tree for context

## Outputs

- `workaround-plans`: For each dependency: the workaround procedure, the resources required, the expected degraded performance level, and the maximum duration the workaround can sustain
- `workaround-gaps`: Dependencies where no viable workaround exists, requiring redundancy investment

## Process

1. For each dependency, design the workaround: what replaces it, who executes the switch, and what is the degraded level of service?
2. Write the workaround as a step-by-step procedure that someone unfamiliar with the system can follow. If it requires tacit knowledge that only one person holds, the workaround is not viable.
3. Estimate how long the workaround can sustain the function. Some workarounds work for days but not months (manual processes replacing automated ones).
4. For dependencies with no viable workaround, flag them for redundancy investment: hire a second person, deploy a backup system, qualify a second vendor.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
