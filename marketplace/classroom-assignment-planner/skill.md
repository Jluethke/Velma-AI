# Classroom Assignment Planner

Assign the child to a classroom and set the start date.

## Inputs

- `immunization-status`: Confirmed immunization compliance or exemption
- `enrollment-packet`: Completed enrollment forms with child details

## Outputs

- `classroom-assignment`: Assigned classroom, lead teacher, and age group
- `start-date`: Confirmed first day of attendance

## Process

1. Check the current enrollment count for each eligible classroom against ratio limits.
2. Assign the child to the classroom with available capacity in their age group.
3. Coordinate with the lead teacher on the start date and any transition plan.
4. Confirm the start date with the family.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
