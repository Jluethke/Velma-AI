# Defensive Checks Versus Assertions

**One-line description:** Classifies every check in safety-relevant code as a compile-time assertion, a debug-only assert for internal invariants, or a release defensive check with a defined fault reaction, using a fixed decision table, and fixes asserts that carry side effects or guard external data.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `codebase_dir` (string, required): Source tree root.
- `requirements` (object[], required): Software requirements with IDs, including the fault reactions specified for invalid inputs (for example "on implausible pedal signal, set torque request to zero and set DTC").

---

## Outputs

- `check_classification` (object[]): Per check site: file, line, current form (`assert`, `if`, macro), data origin (external or internal), required form, the requirement ID of its fault reaction, and the change made.

---

## Phase 1: Inventory Checks and Data Origins

### Entry Criteria
- `requirements` contains at least one fault reaction requirement; if none, record an open question and continue with classification only.

### Actions
1. Find checks: `grep -rnE "\bassert\s*\(|static_assert|_Static_assert|configASSERT|DEV_ASSERT" src include`, plus project assert macros found in `include/`.
2. Find public entry points of each module (functions declared in its header, ISR handlers, message callbacks).
3. For every parameter and every read of hardware, CAN, LIN, Ethernet, NVM or calibration data, mark origin "external". Values produced inside the same unit after validation are "internal".

### Output
Check list and data origin map.

### Quality Gate
- Every function declared in a module header appears in the entry point list.

---

## Phase 2: Classify

### Entry Criteria
- Inventory exists.

### Actions
1. Apply this table, first matching row wins:

| Condition | Required form |
|---|---|
| The fact is known at compile time (array size, struct size, enum count, type width) | `static_assert` (C++11, C23) or `_Static_assert` (C11) |
| The value comes from outside the unit (external origin) | Release defensive check: `if` with a defined reaction from `requirements` (status return, substitute value, diagnostic). Never `assert`. |
| The condition can only fail through a programming error inside the unit (internal invariant, impossible switch default) | `assert` for test builds, plus a release reaction if the requirement defines one for that state |
| Unsure of origin | Treat as external |

2. Check each existing `assert` for side effects: `assert(read_sensor() == OK)` disappears entirely when `NDEBUG` is defined. Any call, increment or assignment inside `assert` is a defect.
3. Record whether the release build defines `NDEBUG`: `grep -c -- "-DNDEBUG" build/target/compile_commands.json`. CMake's Release configuration adds it by default.
4. Fault reactions must never block, delay or gate a brake or emergency-stop request. If a requirement's reaction would do so, record it as a requirement defect.

### Output
Classified list.

### Quality Gate
- Every external-origin check has a required form of "release defensive check" and a requirement ID or an open question.
- Every `assert` with a side effect is listed as a defect.

---

## Phase 3: Apply Changes

### Entry Criteria
- Classification done.

### Actions
1. Convert external-data asserts to `if` checks with the requirement's reaction. Add a unit test that feeds the invalid value and checks the reaction.
2. Move side effects out of asserts: `rc = read_sensor(); assert(rc == OK);` plus the release reaction when `rc` is external.
3. Convert compile-time facts to `static_assert`, for example `_Static_assert(sizeof(can_frame_t) == 16u, "frame layout");`.
4. Test both configurations: host-test without `NDEBUG` and a host build with `-DNDEBUG`. The defensive tests must pass in both.
5. One module at a time.

### Output
`check_classification`.

### Quality Gate
- `ctest` passes in both the assert-enabled and `-DNDEBUG` host builds.
- `grep -rnE "assert\s*\([^)]*(\+\+|--|=[^=]|\w+\s*\()" src` returns no hits outside recorded exceptions.

---

## Worked Example

Illustrative only. Accelerator pedal input in a torque request module, requirement REQ-PED-007: "If the two pedal tracks disagree beyond the calibrated tolerance, request zero drive torque and set DTC P2138."

```
src/pedal.c:63:  assert(abs(trk1 - trk2) <= PED_TOL);
```

Tracks come from the ADC: external. The assert vanishes in Release (`-DNDEBUG` found in the target database). Replaced with an `if` that requests zero torque and sets the DTC; test `pedal_tracks_disagree_requests_zero_torque` passes with and without `NDEBUG`. The reaction affects drive torque only; the brake path is untouched.

---

## Exit Criteria

DONE when every check matches its required form, no assert has side effects or guards external data, and defensive tests pass with and without `NDEBUG`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No fault reaction requirements exist | **Return**: ask the requirement owner; mark each external check "reaction undefined" as an open question. |
| Phase 2 | Project assert macro stays active in release and resets the ECU | **Adjust**: classify it as a release reaction and confirm a requirement specifies reset as the reaction. |
| Phase 2 | Reaction would gate braking or emergency stop | **Stop**: report the requirement defect; do not implement it. |
| Phase 3 | Test passes only with asserts enabled | **Retry**: the release check is missing or wrong; fix and rerun both builds. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
