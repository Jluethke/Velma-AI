# Pcrm Contact Roster Capture

Pull every meaningful contact out of scattered sources (phone, email, messaging apps, past calendars) into one roster, so the system starts from a complete picture instead of the handful of people who happen to be top of mind.

## Inputs

- `contact-sources`: The places your contacts currently live: phone contacts, email address book, messaging apps, social connections, past calendar invites, business cards
- `time-available`: How much time you can spend on the initial capture (a 30 minute pass captures the obvious people, a 2 hour pass catches the long tail)

## Outputs

- `raw-contact-roster`: A single de-duplicated list of every contact worth tracking, with name and at least one way to reach them
- `source-coverage-notes`: Which sources you pulled from and which you skipped, so you know where gaps remain

## Process

1. Export or copy contacts from each source into one list. Do not filter yet. A name you are unsure about stays in for now, because deleting is faster than remembering someone you dropped.
2. Remove duplicates by matching on email and phone first, then on name. When two records clearly belong to the same person, merge them and keep every reachable address.
3. Apply one inclusion test to each name: have you interacted with this person on purpose in the last two years, or do you expect to on purpose in the next one? If neither, move them to a separate parked list rather than the active roster.
4. Record which sources you covered. The long tail (old calendars, event attendee lists) holds people you have forgotten but who still matter, so note any source you did not have time to pull.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
