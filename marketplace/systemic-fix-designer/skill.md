# Systemic Fix Designer

Design a systemic fix for each root cause. The fix changes the system so that the failure cannot recur, or is caught before it causes damage.

## Inputs

- `systemic-root-causes`: The 1-3 root causes to fix
- `event-timeline`: The context for understanding the system

## Outputs

- `systemic-fixes`: For each root cause: the specific system change (process, tool, incentive, information flow), the owner, the deadline, and the expected effect
- `fix-verification-plan`: How to verify the fix works: the test scenario and the success criterion

## Process

1. For each root cause, design the fix hierarchy: 1) Eliminate (remove the possibility of the failure), 2) Automate (have a system catch it), 3) Proceduralize (add a process step), 4) Train (teach people to recognize it). Higher on the hierarchy is more reliable.
2. A fix that requires people to remember something is weaker than a fix that makes the wrong action impossible. Example: instead of training people to check the flag before deploying, make the deployment script check the flag automatically.
3. Assign an owner and a deadline. The fix must be implemented, not just designed. Set the deadline within 30 days for critical fixes.
4. Design the verification: after the fix is in place, simulate the original scenario. Does the fix prevent the failure? If not, iterate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
