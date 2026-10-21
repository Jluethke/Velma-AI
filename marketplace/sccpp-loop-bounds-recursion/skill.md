# Bounded Loops and Recursion Removal

**One-line description:** Finds every recursive call chain and every loop whose iteration count is not bounded by a constant or a checked input, removes the recursion, and adds an explicit bound with a defined reaction when the bound is reached.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `codebase_dir` (string, required): Source tree root.
- `build_profiles` (object, required): From `sccpp-cmake-build-profiles`; host-test compile database.

---

## Outputs

- `loop_recursion_report` (object): Every recursive chain found (with the tool that found it), every loop with its bound and the source of that bound, the changes made, and remaining items such as calls through function pointers that tools cannot resolve.

---

## Phase 1: Find Recursion

### Entry Criteria
- Host-test `compile_commands.json` exists.

### Actions
1. Run `clang-tidy -p build/host-test -checks='-*,misc-no-recursion' src/*.c src/*.cpp`. Each finding names a function "within a recursive call chain" and the notes list the cycle.
2. With GCC 10 or newer, add `-fcallgraph-info` to a scratch build of the host profile; it writes one `.ci` file per translation unit (VCG graph format) listing edges. Search for cycles across files with the call edges extracted from these files.
3. List every call through a function pointer: `grep -rnE "\(\s*\*\s*[a-zA-Z_]+\s*\)\s*\(" src` plus calls on struct members that are function pointers. Tools cannot follow these; each one is a manual review item.
4. Record the guidelines: MISRA C:2012 Rule 17.2 (functions shall not call themselves, directly or indirectly) and the corresponding MISRA C++:2023 or AUTOSAR C++14 rule from the user's copy.

### Output
List of recursive chains and unresolved indirect calls.

### Quality Gate
- `misc-no-recursion` output is saved, even when empty.
- Every function pointer call site is listed with the set of functions it may point to, taken from the assignments in source.

---

## Phase 2: Remove Recursion

### Entry Criteria
- Recursive chains listed.

### Actions
1. Rewrite each recursive function as a loop. For tree or list traversal use an explicit stack array of fixed depth; the depth must come from the data structure's documented maximum (for example a configuration table depth set in a requirement). If no maximum is documented, record an open question.
2. Keep the old function under test: write a unit test comparing old and new outputs for the same inputs before deleting the old version.
3. Edit one function, rebuild, run tests, then move on.

### Output
Recursion-free code with tests.

### Quality Gate
- Rerun of `misc-no-recursion` prints zero findings.
- The old-versus-new comparison test passes before the old function is removed.

---

## Phase 3: Bound Every Loop

### Entry Criteria
- No recursion remains.

### Actions
1. List loops: `grep -rnE "\b(for|while|do)\b" src`.
2. Classify each loop:

| Loop form | Bounded? | Action |
|---|---|---|
| `for (i = 0u; i < N; i++)` with `N` a compile-time constant and `i` not modified in the body | yes | Record N's source |
| Loop over a length from an external source (CAN DLC, buffer length parameter) | only if the length is checked against a constant maximum before the loop | Add the check if missing |
| `while (!(REG & FLAG))` polling hardware | no | Add an iteration or timer bound and a timeout status return |
| `while (1)` or `for (;;)` main loop or task body | intentionally infinite | Record as the scheduler loop; nothing else may be infinite |

3. For polling loops, the bound must come from the hardware datasheet timing (for example the documented maximum conversion time) converted to iterations or a timer count. Record the citation. Never pick a number.
4. On reaching the bound, return a timeout status and let the caller apply its fault reaction. The timeout path must not block any brake or emergency-stop request.
5. Check MISRA C:2012 Rule 14.2 (a for loop shall be well-formed) for each `for` loop: one loop counter, not modified in the body.

### Output
`loop_recursion_report`.

### Quality Gate
- Every loop in the grep list has a row with a bound source or the intentional-infinite label, and exactly one intentional infinite loop per task or main.
- Every added timeout path has a unit test that forces it (a register stub that never sets the flag) and passes.

---

## Worked Example

Illustrative only. ADC driver in a battery management module.

```
src/adc.c:44:  while ((ADC1->SR & ADC_SR_EOC) == 0u) { }
```

Datasheet states maximum conversion time; with the timer tick this gives a bound recorded with its datasheet section. New code polls a free-running timer and returns `ADC_TIMEOUT` past the bound. Test `test_adc_timeout_when_eoc_never_set` uses a stub register that stays 0 and expects `ADC_TIMEOUT`. `misc-no-recursion` reported one chain `cfg_walk -> cfg_walk`, rewritten with a fixed-depth explicit stack.

---

## Exit Criteria

DONE when no recursive chain remains, every function pointer target set is reviewed, and every loop is bounded by a cited constant or checked input, or is the single intentional task loop.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `-fcallgraph-info` not supported (GCC older than 10) | **Adjust**: rely on `misc-no-recursion` and manual review of indirect calls; record the gap. |
| Phase 2 | Recursion depth has no documented maximum | **Stop**: record the open question; the iterative stack size cannot be set without it. |
| Phase 3 | Datasheet gives no maximum time for a hardware flag | **Adjust**: record an open question and ask the user for the vendor's figure; keep the loop listed as unbounded. |
| Phase 3 | Timeout reaction would delay a brake or emergency-stop path | **Stop**: braking and emergency stop are never gated by software; redesign so the timeout only affects the non-safety function. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
