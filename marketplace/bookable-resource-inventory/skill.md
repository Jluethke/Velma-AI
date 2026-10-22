# Bookable Resource Inventory

Inventory the shared resources that will be available for booking.

## Inputs

- `resource-types`: Types of resources to manage (rooms, equipment, vehicles, desks, other)
- `organization-context`: The organization or facility where resources are located

## Outputs

- `resource-catalog`: Catalog of bookable resources with name, type, location, capacity, and features
- `resource-rules`: Per-resource booking rules (advance notice, max duration, cleanup time, approval required)

## Process

1. List every shared resource that should be bookable, grouped by type.
2. For each resource, record: name, type, location, capacity (for rooms), features (AV equipment, whiteboard, wheelchair accessible), and photo if helpful.
3. Define the booking rules per resource: minimum advance notice, maximum booking duration, buffer/cleanup time between bookings, and whether approval is required.
4. Note any resources with restricted access (executive conference room, specialized equipment requiring certification).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
