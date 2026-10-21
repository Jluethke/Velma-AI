# C: Error Handling With Status Returns

**One-line description:** Puts C error handling on one status enum per module, makes ignored return values a build error with warn_unused_result or C23 nodiscard, and fixes errno use and unchecked calls found by MISRA C:2012 Rule 17.7 and Rules 22.8 to 22.10.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `codebase_dir` (string, required): Source tree root of the C code base.
- `check_classification` (object[], required): From `sccpp-defensive-vs-assert`; the release defensive checks whose reactions return a status.

---

## Outputs

- `c_error_report` (object): The status type per module, the functions converted, every ignored return value found and fixed or cast to void with reason, errno sites fixed, and the compiler and analyzer results proving no unchecked calls remain.

---

## Phase 1: Inventory Error Signaling

### Entry Criteria
- C code base builds in the host-test profile.

### Actions
1. List how functions currently report errors: `grep -rnE "return\s+-1|return\s+NULL|errno\s*=|\bsetjmp\b|\blongjmp\b" src`.
2. List existing status types: `grep -rnE "typedef\s+enum[^;]*\{" include src` and read names ending in `_status_t`, `_err_t`, `Std_ReturnType` (AUTOSAR classic platform type with `E_OK` and `E_NOT_OK`).
3. Record `setjmp`/`longjmp` uses: MISRA C:2012 Rule 21.4 bans `<setjmp.h>`; each one is a defect.

### Output
Error signaling inventory.

### Quality Gate
- Inventory lists each module with its current error mechanism.

---

## Phase 2: Define Status Types and Mark Functions

### Entry Criteria
- Inventory exists.

### Actions
1. Use one status type per module, or the project-wide type if the project already has one (for example `Std_ReturnType`). Do not invent a second type when one exists.
2. Shape for a new type: `typedef enum { WSS_OK = 0, WSS_ERR_RANGE, WSS_ERR_TIMEOUT, WSS_ERR_PARAM } wss_status_t;` Values describe the fault class the caller must react to.
3. Return results through an output pointer parameter so the return value is always the status: `wss_status_t wss_get_speed(uint8_t wheel, uint16_t *speed_out);`. Check `speed_out != NULL` as a defensive check.
4. Mark every status-returning function so ignoring it warns:
   - GCC and Clang: `__attribute__((warn_unused_result))` on the declaration (wrap in a project macro such as `MUST_CHECK`).
   - C23: `[[nodiscard]]`, only if the build uses `-std=c2x` or `-std=c23` and the compiler accepts it.
5. Build with `-Werror=unused-result` (GCC and Clang warning name) so an ignored status fails the build.

### Output
Updated headers.

### Quality Gate
- Host-test build with `-Werror=unused-result` exits 0 after fixes in Phase 3, and fails before them if any ignored call existed (record the count from the first failing build).

---

## Phase 3: Fix Callers and errno Use

### Entry Criteria
- Headers marked.

### Actions
1. For every ignored-result error, handle the status per the reaction in `check_classification` or the requirement. Casting to `(void)` is allowed only where the requirement states the result is irrelevant; add a comment with the requirement ID. This is the documented way to satisfy MISRA C:2012 Rule 17.7.
2. For standard library functions that set errno (`strtol`, `strtoul`), follow Rules 22.8 to 22.10: set `errno = 0` before the call, test `errno` right after the call, and test it only after functions documented to set it.
3. Remove `setjmp`/`longjmp` by returning a status up the call chain.
4. Run Cppcheck MISRA addon for IDs `misra-c2012-17.7`, `misra-c2012-22.8`, `misra-c2012-22.9`, `misra-c2012-22.10`, `misra-c2012-21.4`, and clang-tidy `cert-err33-c` (unchecked standard library calls).
5. Unit test each error path: force the callee to return each status value through a stub and check the caller's reaction.

### Output
`c_error_report`.

### Quality Gate
- Build with `-Werror=unused-result` exits 0.
- Cppcheck count for the listed MISRA IDs and clang-tidy count for `cert-err33-c` are 0, or each remaining hit has a deviation record ID.
- Every status value of every converted function has a caller test that passes.

---

## Worked Example

Illustrative only. Body controller NVM read.

```
src/door_cfg.c:22:  nvm_read(NVM_BLK_DOOR, &cfg, sizeof cfg);
error: ignoring return value of 'nvm_read' declared with attribute 'warn_unused_result' [-Werror=unused-result]
```

Requirement REQ-DOOR-014: on NVM read failure, use the default door configuration and set a DTC. Caller changed to check `NVM_OK`, else load `door_cfg_default` and log the DTC. Stub tests for `NVM_ERR_CRC` and `NVM_ERR_BUSY` pass.

---

## Exit Criteria

DONE when every status-returning function is marked, no ignored status remains without a requirement-cited `(void)` cast, errno and setjmp findings are zero or deviated, and every error path has a passing test.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Two status conventions in one code base | **Adjust**: keep the project-wide one; convert the other at module boundaries. |
| Phase 2 | Vendor header functions return ignored values | **Adjust**: wrap vendor calls in a project function that checks and returns a status. |
| Phase 3 | Requirement for the reaction is missing | **Return**: record an open question; do not invent a reaction. |
| Phase 3 | `(void)` casts added in bulk to pass the build | **Stop**: revert; each cast needs a requirement citation. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
