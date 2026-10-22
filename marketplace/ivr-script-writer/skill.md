# Ivr Script Writer

Write the scripts for all IVR prompts, greetings, and hold messages.

## Inputs

- `menu-tree`: The IVR menu tree
- `routing-rules`: Routing destinations

## Outputs

- `ivr-scripts`: Written scripts for every prompt: greeting, menu options, confirmations, errors, hold messages, after-hours
- `recording-schedule`: List of recordings needed with estimated duration

## Process

1. Write the main greeting (keep it under 10 seconds).
2. Write each menu option prompt (state the option before the number: 'For billing, press 1').
3. Write the error prompts (invalid input, timeout, too many retries).
4. Write the hold messages and estimated wait time announcements.
5. Write the after-hours and holiday greetings.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
