# Volunteer Schedule Builder

Build a volunteer schedule matching people to shifts based on availability, skills, and preferences.

## Inputs

- `volunteer_list`: Signed-up volunteers with availability
- `role_descriptions`: Roles with time slots
- `special_requirements`: Any special scheduling needs

## Outputs

- `master_schedule`: Complete volunteer schedule
- `backup_plan`: Backup volunteers for no-shows
- `contact_sheet`: Contact info for all scheduled volunteers

## Process

1. Collect availability from all volunteers
2. Match skills to roles
3. Build schedule avoiding conflicts
4. Identify backup volunteers per shift
5. Confirm schedule with all volunteers

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
