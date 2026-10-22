# Friction Classification

Classify each step by whether it is essential, deferrable, or removable.

## Inputs

- `step-inventory`: All onboarding steps
- `step-count`: Total steps

## Outputs

- `classified-steps`: Each step classified as: essential (must happen before first value), deferrable (needed eventually but not before first value), or removable (does not need to happen at all)
- `removal-candidates`: Steps that can be removed entirely without affecting the user's ability to get value

## Process

1. For each step, ask: can the user get value without completing this step? If yes, the step is deferrable or removable.
2. Essential steps are rare. Creating an account might be essential. Verifying email is usually deferrable. Filling out a profile is almost always deferrable. Watching a tutorial is removable if the product is intuitive enough.
3. For form fields: do you need this information before the user gets value, or can you ask for it later? Most fields can be deferred. Name and email might be essential. Phone number, company size, and industry can be collected after first value.
4. The goal is to reduce the path to first value to the absolute minimum number of essential steps.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
