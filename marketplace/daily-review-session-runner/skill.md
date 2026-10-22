# Daily Review Session Runner

Run a daily review session: present each due card, test recall, score pass/fail, and update the interval.

## Inputs

- `interval-schedule`: The current schedule with due dates for each card
- `review-cards`: The card set

## Outputs

- `session-results`: For each reviewed card: pass or fail, time to answer, and the new interval
- `updated-schedule`: The schedule with updated due dates based on today's results

## Process

1. Pull all cards due today (due date is today or earlier).
2. For each card: read the prompt, attempt to recall the answer before looking, then check your answer. Score it pass (recalled correctly and completely) or fail (any error or blank).
3. Be strict on scoring. A partial answer is a fail. The point of the system is to build reliable recall, and lenient scoring undermines it.
4. Update each card's interval and due date based on the score. A pass advances to the next interval. A fail resets to interval 0.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
