# Build Test Learn Iteration Loop

Run the article against its test questions, capture the data, extract the one dominant lesson, and feed a single change back into the next build.

## Inputs

- `test-article`: The built and instrumented article with its build record
- `test-questions`: The falsifiable questions with pass/fail thresholds from scoping

## Outputs

- `iteration-finding`: The measured answer to each test question, the dominant failure or limiting mechanism, and its confidence level
- `next-change`: The single highest-value design or test change for the next loop, with the predicted effect stated before the next test runs

## Process

1. Run the test to the question, then keep going to failure when safe. The pass/fail answer tells you whether this design works; running past the threshold to the actual failure point tells you the margin and the failure mode, which is what you need to design the next iteration.
2. Identify the single dominant mechanism that set the result. Most prototypes are governed by one thing: a stress concentration, a thermal path, a resonance, a leak path. Chasing three secondary effects while the dominant one is unaddressed wastes a full loop.
3. Change one thing per loop when you are isolating a mechanism; change several when you are exploring a wide space early. Early loops can be coarse and multi-variable to find the neighborhood; late loops must be single-variable to confirm cause and effect.
4. Predict the next result before you build. Write the number you expect from the change. When the next test matches the prediction, your mental model is correct and you can advance; when it does not, the gap is the most valuable datum in the program.
5. Keep the loop short enough that the team remembers the last build. A loop under one to two weeks preserves context and momentum; a loop of two months loses the thread and invites over-scoped builds. Favor more, smaller loops over fewer, larger ones.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
