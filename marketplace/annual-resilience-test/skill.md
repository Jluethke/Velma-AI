# Annual Resilience Test

Test the resilience plan annually. A plan that has never been tested is a hypothesis, not a plan.

## Inputs

- `shock-response-playbooks`: The response protocols to test
- `reserve-targets`: The reserve targets to verify

## Outputs

- `test-results`: For each category: what worked, what failed, and the specific fixes
- `updated-resilience-plan`: The revised plan incorporating the test findings

## Process

1. For reserves: verify the balances, confirm the access procedures work (can you actually withdraw within 5 business days?), and check that the reserve policy has been followed.
2. For redundancies: test the backup. Switch to the backup income source, system, or workspace for a day. If you cannot, the redundancy is theoretical.
3. For response protocols: run a tabletop exercise. Pick a shock scenario, walk through the playbook, and note every step where the instructions are unclear, missing, or wrong.
4. Update the plan with the findings. Set the next test date.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
