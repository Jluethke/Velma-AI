# Hardware Root Cause Fault Tree

Build a fault tree from the failure mode down to candidate root causes, test each hypothesis against the evidence, and converge on the proven cause.

## Inputs

- `failure-mode`: The identified mechanism, origin, and crack direction
- `material-findings`: The metallographic and compositional findings and any nonconformance

## Outputs

- `root-cause`: The confirmed root cause (or causes), stated as the chain from initiating condition to failure, with the evidence that supports it and rules out alternatives
- `hypothesis-ledger`: The list of candidate causes considered, the test for each, and why each was confirmed or eliminated

## Process

1. Build the fault tree top-down from the observed failure. Put the failure at the top, then branch into the independent ways it could occur: higher load than designed, lower strength than designed (material/process), a stress concentration, an environmental assist, or a maintenance/assembly error. Keep branches mutually exclusive so evidence can eliminate whole branches.
2. Turn each branch into a falsifiable hypothesis with a discriminating test. 'Fatigue from under-strength material' predicts a specific hardness deficit and origin at an inclusion; 'fatigue from a stress riser' predicts a sharp geometric origin at spec material. Each hypothesis should predict something the evidence can confirm or refute.
3. Use the stress-versus-strength frame to separate cause classes. A failure is load exceeding capability: either the load was higher than design (duty, misuse, resonance) or the capability was lower than design (material, process, defect, damage). The fractography and metallography usually point to one side; confirm which.
4. Eliminate hypotheses with evidence, not opinion. Keep the hypothesis ledger: for each candidate, record the test and the result that confirmed or killed it. A root cause asserted without having ruled out the alternatives is a guess that will not survive the next recurrence.
5. State the root cause as a causal chain and distinguish contributing from root. Write it from the initiating condition through the mechanism to the failure (for example: forging lap at the fillet, not detected in inspection, grew by fatigue under the normal spectrum to critical size). Separate the true root cause from contributing factors so the corrective action targets the right level.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
