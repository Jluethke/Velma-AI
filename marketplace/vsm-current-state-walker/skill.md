# Vsm Current State Walker

Walk the process floor and collect current state data.

## Inputs

- `product-family`: Product family to map
- `stream-boundaries`: Start and end points

## Outputs

- `process-data`: Cycle times, changeover times, uptime, inventory, batch sizes per step
- `information-flow`: How scheduling and production signals move

## Process

1. Walk the process from shipping back to raw material (door to door)
2. Record cycle time, changeover time, uptime, batch size, and operators at each step
3. Count inventory between each step
4. Map the information flow: how does each step know what to produce next

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
