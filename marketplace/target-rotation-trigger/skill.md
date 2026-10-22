# Target Rotation Trigger

Define when to stop practicing the current sub-skill and rotate to the next weakest one.

## Inputs

- `sub-skill-scores`: Baseline scores for all sub-skills
- `progression-rules`: How difficulty has been increasing

## Outputs

- `rotation-criteria`: The specific conditions under which you stop practicing this sub-skill and move to the next
- `reassessment-protocol`: How to re-score all sub-skills to find the new weakest

## Process

1. Rotate when the current sub-skill is no longer the weakest. This typically happens when you can perform at the target level consistently (80%+ success rate at the target difficulty for 5 consecutive sessions).
2. To find the new weakest: re-perform the original performance decomposition. Your sub-skill scores have shifted. The new weakest gets the next practice cycle.
3. Do not rotate too early. A sub-skill that feels improved but has not been tested at the target difficulty is not actually improved.
4. Maintain each improved sub-skill with one session per week to prevent decay while you focus on the new target.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
