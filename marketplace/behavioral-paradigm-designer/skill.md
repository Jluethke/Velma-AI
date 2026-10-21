# Behavioral Paradigm Designer

Design the behavioral task (stimulus timing, conditions, trial structure, response recording) compatible with the imaging environment.

## Inputs

- `refined-hypothesis`: What the task needs to test
- `cognitive-model`: Which processes to engage or contrast

## Outputs

- `paradigm-spec`: Trial structure, timing, conditions, stimuli, and response requirements
- `stimulus-set`: Stimulus materials with counterbalancing scheme
- `behavioral-predictions`: Expected RT and accuracy differences between conditions

## Process

1. Design conditions that isolate the cognitive contrast of interest
2. Set trial timing compatible with the hemodynamic response (for fMRI) or ERP windowing (for EEG)
3. Build the stimulus set with counterbalancing across participants
4. Define response collection (button box, verbal, eye tracking)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
