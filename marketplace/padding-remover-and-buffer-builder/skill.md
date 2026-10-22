# Padding Remover And Buffer Builder

Remove the safety padding from individual task estimates and concentrate it into project and feeding buffers.

## Inputs

- `critical-chain`: The resource-leveled critical chain
- `task-network`: The full task network

## Outputs

- `aggressive-estimates`: Each task's duration cut to the 50% confidence estimate (the estimate that is right half the time), removing the safety padding
- `project-buffer`: A buffer at the end of the critical chain, sized at 50% of the total padding removed from critical chain tasks
- `feeding-buffers`: Buffers where non-critical paths join the critical chain, sized at 50% of the padding removed from those paths

## Process

1. For each task, ask the estimator: 'What is your 50% confidence estimate (you are equally likely to finish early as late)?' and 'What is your 90% confidence estimate (the safe one)?' The difference is the safety padding.
2. Use the 50% estimate as the task duration. Aggregate the removed padding: for critical chain tasks, half of the total removed padding becomes the project buffer. For non-critical paths, half of the removed padding becomes the feeding buffer at the junction point.
3. Place the project buffer at the end of the critical chain. It protects the project finish date. Place each feeding buffer at the point where a non-critical path joins the critical chain. It protects the critical chain from delays on non-critical paths.
4. The project duration is: aggressive critical chain duration plus project buffer. This is typically shorter than the original critical path because concentrated buffers are smaller than dispersed padding.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
