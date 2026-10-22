# Ivr Menu Tree Builder

Define the IVR menu tree with options, routing, and shortcuts.

## Inputs

- `caller-journeys`: Journey maps for each call type
- `routing-requirements`: Routing destinations

## Outputs

- `menu-tree`: Complete IVR menu tree with numbered options, sub-menus, and routing targets
- `shortcut-map`: DTMF shortcuts for frequent callers (e.g., press 0 for agent)

## Process

1. Design the top-level menu with no more than 5 options, ordered by call volume.
2. Add sub-menus only where necessary, keeping the tree no deeper than 3 levels.
3. Define shortcuts: press 0 for agent, press # to repeat, press * for main menu.
4. Map each terminal menu option to its routing destination.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
