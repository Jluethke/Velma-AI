# Small Group Registration Manager

Manage member registrations into small groups.

## Inputs

- `leader-roster`: Available leaders and their group assignments
- `training-curriculum`: What leaders have been trained on

## Outputs

- `group-roster`: Each group with its leader, members, meeting time, and location
- `waitlist`: Members waiting for a spot if groups are full

## Process

1. Open registration with the group catalog: type, leader, meeting day and time, location, and description.
2. Allow members to select their preferred group or request a recommendation based on interests and schedule.
3. Cap groups at the target size and add overflow to the waitlist.
4. Notify leaders of their group roster and provide member contact information.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
