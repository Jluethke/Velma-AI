# Experiment Learnings Recorder

Record what you learned, whether the experiment succeeded or failed. Failed experiments are not wasted experiments if you learned something. Record the hypothesis, the result, and the next question. This builds an experiment history that prevents you from re-running the same tests.

## Inputs

- `experiment-result`: The conclusion of the experiment
- `experiment-idea`: The original idea, for recording the full lifecycle

## Outputs

- `experiment-record`: The permanent record: hypothesis, design, sample size, runtime, result, confidence interval, and the next question it raises
- `experiment-portfolio`: Updated log of all experiments run, with win/loss/inconclusive counts and cumulative learning

## Process

1. Write the experiment record: what was tested, what was expected, what was observed, what was concluded, and what question this raises next.
2. If the experiment succeeded: what does the effect size tell you about the mechanism? Can you extend it to other areas?
3. If the experiment failed: was the hypothesis wrong (the change does not work), or was the experiment underpowered (the change might work but the sample was too small to detect it)? These are different outcomes with different next steps.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
