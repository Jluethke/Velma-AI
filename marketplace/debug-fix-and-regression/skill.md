# Debug Fix And Regression

Implement and verify the fix for the identified root cause, then run regression to confirm the fix does not introduce new failures.

## Inputs

- `capture-data`: ILA waveform evidence of the failure
- `root-cause-hypothesis`: Identified root cause with supporting evidence

## Outputs

- `fix-implementation`: RTL change that addresses the root cause, with explanation of why the fix is correct and what failure mode it eliminates
- `regression-results`: Results of regression testing showing the original failure is resolved and no new failures are introduced

## Process

1. Implement the fix at the RTL level. If the root cause is a logic error, correct the logic. If it is a timing issue, add pipeline registers or restructure the path. If it is a CDC issue, add the appropriate synchronizer. If it is a race condition, add the necessary handshake or arbitration.
2. Reproduce the failure in simulation with the pre-fix RTL to confirm the test vector catches the bug. Then apply the fix and verify simulation now passes. If you cannot reproduce in simulation, write a test that exercises the specific condition observed in the ILA capture.
3. Run the full regression suite. The fix must not break any existing tests. If regression failures appear, they indicate the fix has a side effect that must be understood and addressed.
4. Rebuild with debug instrumentation and verify on hardware. Reproduce the original failure conditions and confirm the trigger no longer fires (the failure is gone). Run extended stress testing to verify the fix holds under all operating conditions.
5. After hardware verification, remove or disable the debug instrumentation (or leave it in if the resource overhead is acceptable and future debug may be needed). Rebuild for production without ILA cores to recover the BRAM and reduce power consumption.
6. Update the regression test suite with a test that specifically exercises the fixed condition. This prevents the bug from being reintroduced by future changes.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
