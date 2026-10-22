# Recurring Problem Profiler

Profile a recurring problem by documenting its frequency, cost, and the pattern of its occurrences. A problem that happens once is an incident. A problem that happens repeatedly is a system defect.

## Inputs

- `problem-description`: Description of the recurring problem as it appears when it surfaces
- `occurrence-data`: Dates, contexts, and circumstances of recent occurrences

## Outputs

- `problem-profile`: Frequency, average cost per occurrence, total cost over the measurement period, and any patterns in timing or context
- `surface-point`: Where in the process the problem becomes visible (this is where people currently react to it)

## Process

1. Count occurrences over a defined period. If the count is below 3, wait for more data before acting.
2. Calculate the cost of each occurrence (time spent fixing, rework, customer impact, delay).
3. Look for patterns: does it happen on certain days, with certain inputs, with certain people, at certain volumes?
4. Identify where in the process the problem surfaces. This is the symptom, not the cause.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
