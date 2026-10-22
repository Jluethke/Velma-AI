# Loop Stability Check

Check whether the feedback loop is stable or will oscillate. A loop that overreacts to every signal produces wild swings (over-correction). A loop that underreacts misses real changes (under-correction). The goal is a loop that converges on the target.

## Inputs

- `sensor-design`: Measurement frequency and lag
- `controller-design`: Corrective action magnitudes
- `measurement-lag`: Delay between reality and measurement

## Outputs

- `stability-assessment`: Whether the loop will converge (stable), oscillate (unstable), or under-respond (sluggish), with the reason
- `tuning-recommendations`: How to adjust the loop parameters to improve stability

## Process

1. Check for over-correction risk: if the corrective action magnitude is large relative to the error, and the measurement lag is long, the loop will oscillate. You correct, the correction has not shown up in the sensor yet, so you correct again, and then both corrections hit at once.
2. Check for under-correction risk: if the corrective action magnitude is small relative to the error, the loop will be sluggish and may never reach the target.
3. The fix for oscillation is: smaller corrective actions, or longer wait times between actions (wait for the sensor to reflect the last correction before applying the next one). The fix for sluggishness is: larger corrective actions or faster measurement.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
