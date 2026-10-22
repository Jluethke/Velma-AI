# Rating Divergence Detector

Find where the managers diverge and whether any manager leans systematically high or low. A single example rated across three levels is a criteria problem; a manager who rates everything high is a leniency problem.

## Inputs

- `independent-ratings`: The independent ratings
- `rating-spread`: The spread per example

## Outputs

- `divergence-cases`: The widest-scatter examples, set as the agenda for discussion
- `systematic-lean-flags`: Managers whose average runs systematically above or below the group

## Process

1. Sort the examples by how widely the ratings scatter; the widest-scatter examples are the first to discuss.
2. For each manager, compare their average rating against the group average to flag systematic leniency or severity.
3. Separate the two problems: examples that scatter point to unclear criteria, managers who lean point to individual bias.
4. Prepare the divergence cases and lean flags as the agenda for the calibration discussion.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
