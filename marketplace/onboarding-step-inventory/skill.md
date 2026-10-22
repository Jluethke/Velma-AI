# Onboarding Step Inventory

List every step a new user takes from first landing to first value moment.

## Inputs

- `product-or-service`: The product or service being onboarded
- `current-onboarding`: The current onboarding flow as designed

## Outputs

- `step-inventory`: Every step listed: page load, form field, decision point, wait time, confirmation step, tutorial screen, verification step
- `step-count`: Total number of steps from landing to first value

## Process

1. Walk through the onboarding as a brand-new user. Record every action required: clicking a button, filling a field, choosing an option, reading instructions, waiting for a loading screen, verifying an email, setting up a profile.
2. Count everything. A form with 5 fields is 5 steps, not 1. A tutorial with 7 screens is 7 steps. A loading spinner that takes 8 seconds is a step.
3. Record the time each step takes. Some steps are instantaneous (a click). Others take significant time (fill out a profile, verify email, wait for approval).
4. Calculate total time from landing to first value (the moment the user gets the core benefit for the first time). If this exceeds 5 minutes, you have too much friction.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
