# Experimental Protocol Development

Design the behavioral task, trial structure, and recording protocol to answer the scientific question with adequate statistical power.

## Inputs

- `research-question`: The specific hypothesis to test or the neural phenomenon to characterize
- `recording-capabilities`: Available recording system (electrode type, channel count, signal type, recording duration limits)

## Outputs

- `experimental-protocol`: Detailed task design (stimuli, timing, conditions, trial count), recording parameters, and session structure
- `power-analysis`: Required sample size (trials per condition, sessions, subjects) to detect the expected effect size with specified power

## Process

1. Define the experimental conditions from the hypothesis. For a motor encoding study: conditions might be reach directions (8 directions, center-out). For a cognitive study: conditions might be task difficulty levels or stimulus categories. Ensure conditions are balanced and counterbalanced to avoid order effects. Include catch trials or null conditions to estimate baseline activity and false-positive rates.
2. Design the trial structure with precise timing. Define epochs: fixation (500-1000 ms), cue/stimulus (variable by design), delay (if testing working memory, 0.5-3 s), response (movement, speech, button press), inter-trial interval (1-3 s, jittered to prevent anticipatory responses). Total trial duration determines how many trials fit in a session. For intracortical recording in behaving primates: 1-2 hour sessions are typical, giving 300-600 trials for a simple center-out task (3-4 seconds per trial including ITI).
3. Calculate statistical power. For spike rate comparisons between conditions: effect size is the difference in firing rate divided by the standard deviation across trials. With typical neural variability (Fano factor approximately 1), detecting a 20% rate modulation (e.g., 20 Hz vs 24 Hz, SD approximately 5 Hz) gives Cohen's d approximately 0.8. At alpha = 0.05, power = 0.8, need approximately 25 trials per condition per neuron (paired comparison). For population-level decoding: the minimum training set size depends on feature dimensionality. As a rule of thumb: 10 trials per class per feature dimension for LDA, more for nonlinear classifiers.
4. Plan recording sessions. If testing N conditions with M trials each at T seconds per trial: session duration = N x M x T / 3600 hours. Add 20% overhead for rest periods, reward delivery, and equipment checks. For chronic recording studies, plan the recording schedule across days/weeks to capture both within-session and across-session variability. Document the complete protocol in sufficient detail for replication.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
