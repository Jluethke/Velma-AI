# Interval Schedule Configuration

Configure the review intervals based on the Ebbinghaus curve: 1 day, 3 days, 7 days, 14 days, 30 days, 90 days after initial learning.

## Inputs

- `review-cards`: The card set
- `card-count`: How many cards total

## Outputs

- `interval-schedule`: The review schedule: each card starts at interval 1 (1 day), and advances through 3, 7, 14, 30, 90 days on each successful review
- `daily-review-estimate`: Estimated number of cards to review per day once the system reaches steady state

## Process

1. Assign every new card to interval 0 (review tomorrow, 1 day after first seeing it).
2. On successful recall, advance the card to the next interval: 1 day to 3 days to 7 days to 14 days to 30 days to 90 days.
3. On failed recall, reset the card to interval 0 (review again tomorrow). This is the critical rule: failure resets the clock because the memory trace has decayed.
4. Estimate steady-state daily load: with N total cards and a 90% success rate, expect to review roughly N/5 cards per day once the system stabilizes.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
