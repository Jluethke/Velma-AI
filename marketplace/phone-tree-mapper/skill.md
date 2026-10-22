# Phone Tree Mapper

Map the menu structure and routing logic for the phone tree.

## Inputs

- `call-types`: Types of calls the system handles (sales, support, billing, hours, location)
- `routing-destinations`: Where each call type should end up (agent group, voicemail, self-service, callback)

## Outputs

- `menu-tree`: Hierarchical menu structure with options at each level and routing targets
- `routing-rules`: Business hours, overflow, and failover routing for each destination

## Process

1. List all call types and their frequency to set the menu order.
2. Design the menu hierarchy (keep depth to 3 levels or fewer).
3. Define the routing for each leaf node including business hours, queue, and failover.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
