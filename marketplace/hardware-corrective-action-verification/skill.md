# Hardware Corrective Action Verification

Define corrective and preventive actions against the root cause, verify the fix on hardware, and confirm the failure does not recur across the fleet.

## Inputs

- `root-cause`: The confirmed root cause and its causal chain
- `fleet-exposure`: The population of parts that share the root-cause condition and their service status

## Outputs

- `corrective-action`: The corrective action on the root cause and the preventive action on the process that let it escape, each with an owner and a verification method
- `verification-evidence`: The test or analysis that proves the fix works and the fleet disposition that confirms no further recurrence

## Process

1. Separate correction, corrective action, and preventive action. Correction fixes the failed unit; corrective action removes the root cause so new units do not have it; preventive action fixes the process gap (a missing inspection, a loose tolerance) that let the condition escape. All three are usually needed; naming them separately prevents fixing only the symptom.
2. Target the corrective action at the proven root cause, not the symptom. If the root cause was a forging lap that inspection missed, the corrective action changes the forging or the inspection, not the part's wall thickness. A fix aimed at a contributing factor leaves the root cause live.
3. Verify the fix on representative hardware before fleet rollout. Reproduce the original duty on a corrected article and show the failure mode no longer initiates, or demonstrate by analysis anchored to test that the margin is restored. A corrective action closed on paper without verification is unproven.
4. Disposition the exposed fleet by risk. For parts already in service with the root-cause condition, decide inspect, retire, or run-to-limit based on the crack-growth rate and the inspection capability. Set an inspection interval that catches a crack before it reaches critical size if run-on is allowed.
5. Confirm no recurrence and close with evidence. Track the corrected population for the failure's return, confirm the preventive action holds in the process, and close the action only with the verification and fleet evidence attached. Feed the lesson back into design rules and inspection standards so the next program inherits it.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
