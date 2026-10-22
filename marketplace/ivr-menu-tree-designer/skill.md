# Ivr Menu Tree Designer

Design the IVR menu tree including main menu, submenus, and routing destinations.

## Inputs

- `call-volume-data`: Current call volume and top reasons people call
- `department-list`: Departments or queues available for routing

## Outputs

- `menu-tree`: The complete IVR menu tree with options, submenus, and routing destinations
- `routing-rules`: Rules for routing calls to departments, queues, or automated services

## Process

1. List the top call reasons by volume and map each to a department or automated resolution.
2. Design the main menu with no more than 5 options (callers drop off after 5).
3. Design submenus where needed, keeping depth to 2 levels maximum.
4. Add a 'repeat' option and a 'speak to a person' option at every level.
5. Document the routing destination for each terminal menu option.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
