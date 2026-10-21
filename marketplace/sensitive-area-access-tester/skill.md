# Sensitive Area Access Tester

Test access to server rooms, wiring closets, and other sensitive areas.

## Inputs

- `facility-description`: Facility layout with sensitive areas marked
- `bypass-methods`: Methods that worked at perimeter for potential reuse

## Outputs

- `sensitive-area-findings`: Findings from testing access to sensitive areas
- `physical-data-exposure`: Data exposure risks from physical access to equipment

## Process

1. Attempt to access server rooms, network closets, and executive areas using bypass methods
2. Check whether sensitive areas have additional controls beyond perimeter badges
3. Assess what data or systems could be compromised with physical access to each area
4. Check for unlocked network ports, exposed consoles, and visible credentials in sensitive areas

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
