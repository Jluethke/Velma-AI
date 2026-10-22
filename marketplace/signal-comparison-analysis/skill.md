# Signal Comparison Analysis

Compare work sample scores against interview impressions. For each candidate, place them on a 2x2: high work sample / high interview, high work sample / low interview, low work sample / high interview, low work sample / low interview. The interesting candidates are the divergences. High work sample / low interview candidates are often the best hires that traditional processes miss.

## Inputs

- `interview-impressions`: Interviewer predictions for each candidate
- `structured-scores`: Structured interview scores if available

## Outputs

- `signal-comparison-matrix`: 2x2 matrix placing each candidate by work sample score versus interview impression
- `divergence-analysis`: Analysis of candidates where work sample and interview signals disagree, with a recommendation for each

## Process

1. For each candidate, plot their work sample score (rubric total) against their interview impression (yes/maybe/no converted to 3/2/1).
2. Identify the divergent candidates. High work sample / low interview: the process is catching someone the interview would have rejected. Investigate whether the low interview impression was based on surface factors (communication style, appearance, nervousness) rather than capability.
3. Low work sample / high interview: the process is flagging someone the interview would have passed. This is the candidate who interviews well but may underperform. Investigate before advancing.
4. Make the hiring recommendation based primarily on work sample score. Use the interview to assess only what the work sample cannot: collaboration style, values alignment, and motivation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
