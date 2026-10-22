# Pattern Synthesizer

Find the pattern across all 5 performers. The individual interviews contain noise. The pattern is the signal. Look for: the same early action appearing 3+ times, the same hidden skill appearing 3+ times, and the same environment trait appearing 3+ times. These three clusters form the real hiring profile.

## Inputs

- `environment-trait-profile`: Traits that predict success here specifically
- `anti-patterns`: Traits that predict failure here specifically

## Outputs

- `synthesized-profile`: The real hiring profile: the early actions, hidden skills, and environment traits that predict success, derived from the pattern across all 5 performers
- `confidence-levels`: For each element of the profile: how many of the 5 performers exhibited it (3/5 is the minimum threshold)

## Process

1. Lay out all the data from the 5 interviews in a matrix: rows are performers, columns are the early actions, hidden skills, and environment traits collected.
2. Mark which performer exhibited which element. Count the frequency of each element.
3. Keep only elements that appear in 3 or more of the 5 performers. Everything else is individual variation, not a pattern.
4. Write the synthesized profile as a narrative: 'The person who succeeds in this role [does X in the first 90 days], [uses Y skill daily that is not in the job description], and [has Z trait that makes them effective in this specific environment].'

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
