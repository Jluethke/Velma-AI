# Enrollment Inquiry Handler

Receive and respond to a daycare enrollment inquiry with program details and availability.

## Inputs

- `family-contact-info`: Name, phone, email of the inquiring parent or guardian
- `child-age-and-needs`: Age of the child and any special needs or requests

## Outputs

- `program-options`: Available programs matching the child's age group with schedules and rates
- `tour-scheduled`: Confirmed date and time for the facility tour

## Process

1. Check which age-group classrooms have open spots.
2. Match the child's age to the available programs (infant, toddler, preschool, school-age).
3. Provide the program details (schedule, tuition, meals, curriculum approach) to the family.
4. Schedule a facility tour at a mutually available time.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
