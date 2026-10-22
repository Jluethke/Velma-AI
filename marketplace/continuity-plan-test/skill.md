# Continuity Plan Test

Test the continuity plan. A tabletop exercise is the minimum. A simulation is better. A full test is best.

## Inputs

- `first-72-hour-actions`: The action playbook to test
- `recovery-procedures`: The recovery procedures to test

## Outputs

- `test-results`: What worked, what failed, and the specific fixes for each failure
- `updated-continuity-plan`: The revised plan incorporating the test findings, with the next test date scheduled

## Process

1. Choose the test type: tabletop (walk through the plan verbally), simulation (execute the plan with simulated disruption), or full test (actually switch to backup systems and procedures).
2. Run the test. For a tabletop: gather the team, present the scenario, and walk through each step asking 'can we actually do this?' For a simulation: execute the first 4 hours of the playbook against a simulated scenario.
3. Document every failure: steps that were unclear, resources that were unavailable, contacts that were wrong, procedures that took longer than the RTO allows.
4. Update the plan with the fixes. Schedule the next test: annually for tabletops, every 2 years for simulations. After any major change to the operation, re-test the affected sections.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
