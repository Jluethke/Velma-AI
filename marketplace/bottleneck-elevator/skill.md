# Bottleneck Elevator

If exploitation and subordination are not enough, elevate the bottleneck: add capacity through investment. Only invest after exploitation and subordination have been exhausted.

## Inputs

- `exploitation-plan`: The exploitation actions already taken
- `subordination-rules`: The subordination already in place

## Outputs

- `elevation-options`: Options to increase the bottleneck's capacity: additional resources, technology, outsourcing, process redesign, with cost and expected throughput gain for each
- `elevation-decision`: The selected option with the investment amount and the payback period (throughput gain times value per unit divided by investment cost)

## Process

1. List the options to increase the bottleneck's capacity: hire another person, buy another machine, outsource the step, redesign the process, add a shift.
2. For each option, estimate the cost and the throughput gain. Calculate the payback: how many periods until the increased throughput revenue exceeds the investment?
3. Select the option with the shortest payback. If no option has an acceptable payback, the system's throughput is capped at the current bottleneck capacity.
4. After elevation, re-identify the bottleneck. It will have moved to a different step. The new bottleneck is now the constraint, and the cycle begins again.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
