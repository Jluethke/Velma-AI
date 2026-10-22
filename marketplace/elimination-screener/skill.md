# Elimination Screener

Screen every task for elimination first. If stopping the task produces no negative consequence, eliminate it. The cheapest task is the one you do not do.

## Inputs

- `task-inventory`: The full list of tasks with time consumption

## Outputs

- `elimination-candidates`: Tasks that can be eliminated with no negative consequence, with the rationale for each
- `surviving-tasks`: Tasks that survive the elimination screen

## Process

1. For each task, ask: what happens if we stop doing this entirely? If the answer is 'nothing meaningful,' it is an elimination candidate.
2. Common elimination targets: reports nobody reads, meetings with no decisions, approval steps that never reject, duplicate data entry.
3. For each candidate, confirm elimination with the downstream consumer. If they do not notice it missing, eliminate it.
4. Calculate the hours recovered by elimination. This is pure savings with zero implementation cost.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
