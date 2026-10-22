# Halt Test Execution

Execute a Highly Accelerated Life Test to find design weaknesses by stepping stress levels until failures occur, then analyzing and fixing each failure before continuing.

## Inputs

- `thermal-test-plan`: Thermal test parameters
- `vibration-test-plan`: Vibration test parameters

## Outputs

- `operating-limits`: Upper and lower temperature operating limits (where the product fails functionally but recovers) and destruct limits (where permanent damage occurs)
- `vibration-limits`: The vibration level at which the first failure occurs, both at room temperature and at the temperature extremes
- `failure-modes-found`: Each failure discovered: the stress level, the failure mode, root cause analysis, and whether it is relevant to the field environment or only to the extreme test conditions

## Process

1. Start with cold step stress: begin at the lower operating specification and step down 10C at a time, dwelling at each step for 10 minutes and running a functional test. Record the temperature where the product first fails functionally (lower operating limit) and the temperature where it does not recover after returning to room temperature (lower destruct limit).
2. Repeat for hot step stress: start at the upper operating specification and step up 10C at a time. Find the upper operating limit and upper destruct limit. The margin between the specification limit and the operating limit is the thermal design margin.
3. Run vibration step stress at room temperature, then at the temperature extremes found above. Start at 5 Grms and increase in 5 Grms steps, dwelling 10 minutes at each level. The combined thermal and vibration step stress almost always finds failures that neither stress alone reveals.
4. For each failure found, perform root cause analysis before continuing the HALT. Fix the root cause, verify the fix, and then continue stepping from where the failure occurred. The goal is to find and fix as many failure modes as possible in a short time. HALT is a qualitative test to find weaknesses, not a quantitative test to demonstrate reliability. Document every failure even if it occurs far beyond the specification, because field experience may eventually reach stress levels not originally anticipated.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
