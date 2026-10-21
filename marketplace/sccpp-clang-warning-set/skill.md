# Clang Warning Set for Safety-Relevant Code

**One-line description:** Uses a one-time -Weverything survey to discover every Clang diagnostic the code triggers, then builds a named, documented warning set (conversion, comma, unreachable code, enum coverage and more) for the host verification build and promotes clean diagnostics to -Werror.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `codebase_dir` (string, required): Source tree root.
- `build_profiles` (object, required): From `sccpp-cmake-build-profiles`; the host-test profile built with Clang.
- `language` (string, required): "c" or "cpp".

---

## Outputs

- `clang_warning_report` (object): Clang version, the survey counts per diagnostic, the adopted flag list with a reason per flag, the flags excluded with a reason, and the flags promoted to `-Werror=`.

---

## Phase 1: Survey With -Weverything

### Entry Criteria
- `clang --version` first line recorded.

### Actions
1. Configure a survey build only, never the shipped build: `cmake -S . -B build/clang-survey -DCMAKE_C_COMPILER=clang -DCMAKE_C_FLAGS="-Weverything" -DCMAKE_EXPORT_COMPILE_COMMANDS=ON` (use `CMAKE_CXX_COMPILER=clang++` and `CMAKE_CXX_FLAGS` for C++).
2. Build and keep the log: `cmake --build build/clang-survey -j 2>&1 | tee build/clang-survey/survey.log`.
3. Count: `grep -o "\[-W[a-zA-Z0-9-]*\]" build/clang-survey/survey.log | sort | uniq -c | sort -rn > build/clang-survey/counts.txt`.
4. -Weverything is a survey tool. Clang's own documentation advises against it for normal builds because it includes contradictory and experimental diagnostics. Do not ship it.

### Output
`counts.txt` listing every diagnostic that fires.

### Quality Gate
- `counts.txt` exists and its total equals `grep -c "warning:" survey.log`.

---

## Phase 2: Choose the Adopted Set

### Entry Criteria
- Survey counts exist.

### Actions
1. Start from: `-Wall -Wextra -Wpedantic -Wconversion -Wsign-conversion -Wshadow-all -Wcast-align -Wcast-qual -Wundef -Wdouble-promotion -Wformat=2 -Wimplicit-fallthrough -Wcomma -Wunreachable-code-aggressive -Wassign-enum -Wswitch-enum -Wcovered-switch-default -Wvla -Wfloat-equal -Wmissing-variable-declarations`.
2. C only: add `-Wstrict-prototypes -Wmissing-prototypes`. C++ only: add `-Wold-style-cast -Wextra-semi -Wzero-as-null-pointer-constant -Wnon-virtual-dtor -Wsuggest-override`.
3. Confirm each exists: `clang -W<name> -x c -c /dev/null -o /dev/null` must print no "unknown warning option" message.
4. Use this table for diagnostics seen in the survey but not in the start list:

| Diagnostic | Decision |
|---|---|
| `-Wpadded` | Exclude: reports layout, not a defect. Record reason. |
| `-Wdeclaration-after-statement` | Exclude unless the project targets C90. |
| `-Wc++98-compat*` | Exclude for C++17 code. |
| `-Wunsafe-buffer-usage` | Include only if the C++ project adopts its hardening model; otherwise record as open question. |
| Any other diagnostic with hits | Read its entry in the Clang "Diagnostic flags" reference page; include if it names a defect class, exclude with written reason if it names style. |

5. `-Wcovered-switch-default` and `-Wswitch-enum` pull in opposite directions with MISRA's rule that a switch has a default label. Record which one the project keeps and why; this is a guideline plan decision, not a tool choice.

### Output
Adopted flag list and excluded list, each with a reason.

### Quality Gate
- Every diagnostic in `counts.txt` appears in either the adopted or excluded list.
- Every adopted flag passed the existence check.

---

## Phase 3: Apply and Lock

### Entry Criteria
- Adopted list final.

### Actions
1. Configure `build/warnings-clang` with the adopted list and build with a log.
2. Count per flag as in Phase 1.
3. Add `-Werror=<name>` for every adopted flag with zero hits. Pass the rest to `sccpp-findings-triage`.
4. Never add `-Wno-` for an adopted flag to get a clean build. Never edit the survey to drop a hit.

### Output
`clang_warning_report`.

### Quality Gate
- Rebuild with promoted `-Werror=` flags exits 0.
- Report lists per-flag counts from the adopted build.

---

## Worked Example

Illustrative only. CAN signal decoder in C, Clang 17.

```
$ head -4 build/clang-survey/counts.txt
    212 [-Wpadded]
     31 [-Wconversion]
      9 [-Wcomma]
      2 [-Wassign-enum]
src/can_decode.c:88:17: warning: possible misuse of comma operator here [-Wcomma]
```

`-Wpadded` excluded (layout). `-Wcomma` adopted; the 9 hits go to triage. `-Wvla` has zero hits and becomes `-Werror=vla`.

---

## Exit Criteria

DONE when every surveyed diagnostic is adopted or excluded with a reason, the adopted set is applied, and zero-hit flags are promoted.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Survey log is too large to read | **Adjust**: use the counts file and the top ten diagnostics first. |
| Phase 2 | A flag is unknown to this Clang version | **Adjust**: drop it and record the version. |
| Phase 3 | Target compiler is GCC and the Clang set flags code GCC accepts | **Return**: keep both reports; differences go to triage, not to flag removal. |
| Phase 3 | Hits are all in vendor headers | **Adjust**: mark the include path `SYSTEM` and analyze adopted code separately. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
