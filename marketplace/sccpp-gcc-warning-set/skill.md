# GCC Warning Set for Safety-Relevant Code

**One-line description:** Enables a strict, documented GCC warning set (conversion, shadowing, fallthrough, VLA, stack usage and more) on the host verification build, records every warning by flag name, and turns the clean set into -Werror without weakening it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `codebase_dir` (string, required): Source tree root.
- `build_profiles` (object, required): From `sccpp-cmake-build-profiles`; the host-test profile directory and configure command are used.
- `language` (string, required): "c" or "cpp"; selects language-only flags.

---

## Outputs

- `gcc_warning_report` (object): GCC version, the exact flag list applied, warning counts per flag (`[-Wconversion]` and so on), per-file counts, and the flags promoted to `-Werror`.

---

## Phase 1: Apply the Flag Set

### Entry Criteria
- `build_profiles` has a host-test profile built with GCC (`gcc --version` first line recorded).

### Actions
1. Use a separate directory `build/warnings` so the host-test profile stays unchanged.
2. Common flags (C and C++): `-Wall -Wextra -Wpedantic -Wconversion -Wsign-conversion -Wshadow -Wcast-qual -Wcast-align=strict -Wundef -Wdouble-promotion -Wformat=2 -Wnull-dereference -Wduplicated-cond -Wduplicated-branches -Wlogical-op -Wswitch-default -Wswitch-enum -Wimplicit-fallthrough -Wvla -Wfloat-equal -Wredundant-decls`.
3. C only: `-Wstrict-prototypes -Wmissing-prototypes -Wold-style-definition -Wjump-misses-init -Wbad-function-cast`.
4. C++ only: `-Wold-style-cast -Wuseless-cast -Wnon-virtual-dtor -Woverloaded-virtual -Wzero-as-null-pointer-constant -Wextra-semi`.
5. Before using any flag, confirm it exists in the installed GCC: `gcc -Q --help=warning | grep -- "-Wduplicated-branches"`. If a flag is missing in this version, drop it and record that. Never invent a flag.
6. Configure: `cmake -S . -B build/warnings -DCMAKE_C_FLAGS="<flags>" -DCMAKE_EXPORT_COMPILE_COMMANDS=ON` (CMAKE_CXX_FLAGS for C++), then `cmake --build build/warnings -j 2>&1 | tee build/warnings/gcc_warnings.log`.

### Output
Full build log with every warning.

### Quality Gate
- `build/warnings/gcc_warnings.log` exists and the build exit code is recorded.
- Every flag in the applied list was confirmed by `gcc -Q --help=warning`.

---

## Phase 2: Count and Read the Warnings

### Entry Criteria
- Warning log exists.

### Actions
1. Count by flag: `grep -o "\[-W[a-z0-9=-]*\]" build/warnings/gcc_warnings.log | sort | uniq -c | sort -rn`.
2. Count by file: `grep -o "^[^:]*\.[ch]p*:[0-9]*" build/warnings/gcc_warnings.log | cut -d: -f1 | sort | uniq -c | sort -rn`.
3. Read the meaning of the frequent ones with this table:

| Flag in brackets | What it means in ECU code | Typical true problem |
|---|---|---|
| `[-Wconversion]` | Implicit narrowing, for example `uint32_t` into `uint16_t` | Scaled sensor value silently truncated |
| `[-Wsign-conversion]` | Signed to unsigned or back | Negative error code stored in an unsigned length |
| `[-Wimplicit-fallthrough]` | `case` falls into the next without a marker | Missing `break` in a state machine |
| `[-Wdouble-promotion]` | `float` promoted to `double` | Slow soft-float on an FPU-less MCU, precision assumptions |
| `[-Wshadow]` | Inner name hides outer | Wrong variable updated in a loop |
| `[-Wduplicated-branches]` | `if` and `else` bodies identical | Copy-paste error in a fault reaction |

4. Do NOT silence warnings with casts in this flow. Fixes happen in the overflow and type flows, or as triaged deviations.

### Output
Counts per flag and per file.

### Quality Gate
- Sum of per-flag counts equals the total number of lines matching `warning:` in the log (`grep -c "warning:"`).

---

## Phase 3: Lock In -Werror for Clean Flags

### Entry Criteria
- Counts exist.

### Actions
1. For each flag with zero warnings, add `-Werror=<flag-name>` (for example `-Werror=vla`) to the host-test and target profiles, so it cannot regress.
2. For flags with warnings, leave them as warnings and pass the counts to `sccpp-findings-triage`.
3. Never remove a flag to make the build green. Never add `-w` or `#pragma GCC diagnostic ignored` without a deviation record.
4. Write `gcc_warning_report`.

### Output
`gcc_warning_report`.

### Quality Gate
- Rebuilding with the `-Werror=` flags exits 0.
- `grep -rn "pragma GCC diagnostic ignored" "$codebase_dir"` output is listed in the report with a count; each hit is a triage item.

---

## Worked Example

Illustrative only. Wheel speed module in C, GCC 13.

```
$ cmake --build build/warnings -j 2>&1 | grep -o "\[-W[a-z0-9=-]*\]" | sort | uniq -c | sort -rn
     14 [-Wconversion]
      5 [-Wsign-conversion]
      1 [-Wimplicit-fallthrough]
src/wss_scale.c:41:22: warning: conversion from 'uint32_t' to 'uint16_t' may change value [-Wconversion]
```

Phase 3 adds `-Werror=vla -Werror=shadow -Werror=duplicated-branches` (zero hits) and sends the 20 conversion warnings to triage.

---

## Exit Criteria

DONE when the confirmed flag set is applied, every warning is counted by flag and file, and every zero-warning flag is promoted to `-Werror=`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | GCC rejects a flag ("unrecognized command-line option") | **Adjust**: remove that flag, record the GCC version that lacks it. |
| Phase 1 | Thousands of warnings from vendor headers | **Adjust**: include vendor headers with `-isystem` (CMake `SYSTEM` keyword) and record that adopted code is analyzed separately; never hide project code this way. |
| Phase 2 | Log mixes C and C++ compilers | **Adjust**: split counts by the compiler line in `compile_commands.json`. |
| Phase 3 | Promoting a flag breaks the target cross build only | **Return**: report the target-only warning to triage; do not drop the flag from the host build. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
