# GCC Worst-Case Stack Usage

**One-line description:** Uses GCC -fstack-usage and -fcallgraph-info=su on the target build to compute the worst-case stack depth of every task and interrupt entry point and compares it with the stack size the user allocated.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `build_profiles` (object, required): From `sccpp-cmake-build-profiles`; the target profile configure command and compiler.
- `loop_recursion_report` (object, required): From `sccpp-loop-bounds-recursion`; must show no recursion, because a recursive chain has no static worst case.
- `stack_budget_bytes` (object, required): Map of entry point (task function or ISR name) to the stack size allocated for it in bytes, taken from the linker script or RTOS task configuration.

---

## Outputs

- `stack_usage_report` (object): Per function frame size and qualifier from `.su` files, per entry point worst-case path and total, comparison with `stack_budget_bytes`, and unresolved items (dynamic frames, indirect calls, library functions without data).

---

## Phase 1: Generate Stack Data

### Entry Criteria
- The target compiler is GCC (`arm-none-eabi-gcc --version` or equivalent recorded).
- `loop_recursion_report` lists zero recursive chains.

### Actions
1. Configure a scratch copy of the target build with the same flags plus `-fstack-usage -fcallgraph-info=su`: `cmake -S . -B build/stack -DCMAKE_TOOLCHAIN_FILE=<file> -DCMAKE_BUILD_TYPE=Release -DCMAKE_C_FLAGS="-fstack-usage -fcallgraph-info=su"`. The optimization level must equal the release build; frame sizes change with `-O`.
2. Build. Each object gets a `.su` file (lines like `src/can_rx.c:88:6:can_rx_isr	48	static`) and a `.ci` file (call graph with frame sizes).
3. Add `-Wstack-usage=<bytes>` with the smallest value in `stack_budget_bytes` to get a compiler warning for any single frame over it. The value is the user's budget, not a chosen constant.

### Output
`.su` and `.ci` files for every object.

### Quality Gate
- `find build/stack -name "*.su" | wc -l` equals the number of compiled objects (`find build/stack -name "*.o" | wc -l`).

---

## Phase 2: Read Frames and Qualifiers

### Entry Criteria
- `.su` files exist.

### Actions
1. Concatenate: `find build/stack -name "*.su" -exec cat {} + | sort -t$'\t' -k2 -n -r > build/stack/frames.txt`.
2. Read the third column:

| Qualifier | Meaning | Action |
|---|---|---|
| `static` | Fixed frame size | Use the number |
| `dynamic,bounded` | Frame varies but GCC proved a bound; the number is that bound | Use the number |
| `dynamic` | Frame size unbounded (variable length array or `alloca`) | Defect: remove the VLA or alloca (MISRA C:2012 Rule 18.8 bans VLAs) |

3. List functions called but with no `.su` entry (C library, compiler runtime such as `__aeabi_*`, assembly). Their frame sizes are unknown and must come from the library vendor or from disassembly (count `push` and `sub sp` in `objdump -d`); record which.

### Output
Frame table with qualifiers and missing functions.

### Quality Gate
- Zero `dynamic` (unbounded) entries remain, or each is a listed defect.
- Every called function without `.su` data is in the unresolved list.

---

## Phase 3: Compute Worst-Case Paths

### Entry Criteria
- Frame table complete.

### Actions
1. From the `.ci` files build the call graph. For each entry point in `stack_budget_bytes`, the worst-case usage is the maximum over all call paths of the sum of frame sizes.
2. Add indirect calls by hand from the target sets recorded in `loop_recursion_report`.
3. Add interrupt nesting: if interrupts can preempt a task on the same stack (single main stack on a Cortex-M, for example), add the worst ISR path for each nesting level the interrupt priority configuration allows. Record the priority configuration source.
4. Compare each total with its budget and report the margin in bytes. Do not decide what margin is enough; report the number and ask the user for the project's required margin if one is not documented.

### Output
`stack_usage_report`.

### Quality Gate
- Every entry point in `stack_budget_bytes` has a computed total and a path listing each function on it.
- Every total that exceeds its budget is listed as a defect.

---

## Worked Example

Illustrative only. Door control ECU, Cortex-M4, `stack_budget_bytes` = {"door_task": 1024, "main_stack": 2048} (from the RTOS task table and the linker script `_Min_Stack_Size`).

```
$ head -3 build/stack/frames.txt
src/diag_dtc.c:120:13:dtc_store	312	static
src/door_task.c:40:6:door_task	96	static
src/can_rx.c:88:6:can_rx_isr	48	static
```

Worst path `door_task -> dtc_store -> nvm_write -> memcpy` = 96 + 312 + 64 + unknown(memcpy). `memcpy` frame read from disassembly as 16 bytes. Total 488 against 1024. `can_rx_isr` runs on the main stack, so its worst path is added to the `main_stack` figure for each allowed nesting level.

---

## Exit Criteria

DONE when every entry point has a worst-case stack figure with its path, every unresolved function is listed, and every over-budget path is a defect.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Recursion still present | **Return**: run `sccpp-loop-bounds-recursion` first. |
| Phase 1 | Compiler is Clang | **Return**: this flow is GCC-specific; check your Clang version's documentation for stack usage options and record the result as an open question. |
| Phase 2 | `dynamic` entry caused by a VLA | **Adjust**: replace with a fixed array sized from a requirement, rebuild, regenerate data. |
| Phase 3 | Indirect call target set unknown | **Stop**: the worst case is not computable; record the call site as an open question. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
