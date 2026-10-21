# Parity x87 Excess Precision Check

**One-line description:** Detects and removes x87 extended-precision evaluation on 32-bit x86 builds, where intermediates are held in 80-bit registers and double rounding makes results depend on register spills and optimization level, by checking `FLT_EVAL_METHOD` and forcing SSE2 arithmetic.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `port_repo` (string, required): Path to the port with a 32-bit x86 (`i686`) build.
- `fp_flags` (string[], required): Output of `parity-fp-flag-baseline`.

---

## Outputs

- `excess_precision_findings` (object[]): Each build configuration with its `FLT_EVAL_METHOD`, x87 instruction count, and the flag change that removes x87 arithmetic.

---

## Phase 1: Measure Evaluation Method

### Entry Criteria
- An `i686` build of the port exists (for example `-m32` on GCC or Clang, or a Win32 MSVC build).

### Actions
1. Compile and run this probe with the port's exact flags plus `-m32`:
   ```c
   #include <float.h>
   #include <stdio.h>
   int main(void){ printf("FLT_EVAL_METHOD=%d\n", (int)FLT_EVAL_METHOD); return 0; }
   ```
   `gcc <flags> -m32 probe.c -o probe && ./probe`. Value `0` means each operation rounds to its own type. Value `2` means `float` and `double` operations are evaluated in `long double` (x87 80-bit), which the C standard (ISO/IEC 9899, `<float.h>`) defines.
2. Read the result with this table:

| FLT_EVAL_METHOD | Meaning for parity | Action |
|---|---|---|
| 0 | matches CPython `float64` rounding per operation | go to Phase 2 to confirm no x87 instructions remain |
| 1 | `float` evaluated as `double` | only matters for `float32` contracts; record it |
| 2 | x87 extended precision; results can differ from the reference and between `-O0` and `-O2` | add `-msse2 -mfpmath=sse` (GCC or Clang) or `/arch:SSE2` (MSVC) and rerun |
| -1 | indeterminable | treat as 2 |

3. If SSE2 is not allowed on the target CPU, record that bit-exact parity is not achievable with x87 by flags alone. GCC's `-ffloat-store` and `-fexcess-precision=standard` reduce excess precision but cannot remove double rounding of the 64-bit significand. Report it as an open question; do not claim parity.

### Output
Evaluation method per configuration.

### Quality Gate
- The probe ran with the same flags as the port and printed a value.

---

## Phase 2: Confirm No x87 Arithmetic

### Entry Criteria
- `FLT_EVAL_METHOD` is 0 or the user accepted the open question.

### Actions
1. Disassemble the 32-bit port: `objdump -d --no-show-raw-insn -C libport32.a > port32.dis`.
2. Count x87 arithmetic: `grep -cE "\bf(add|sub|mul|div|sqrt|ld|stp?)[lps]*\b" port32.dis`. Some `fld`/`fstp` can remain for return values under the 32-bit calling convention, which returns `double` in `st(0)`; loads and stores do not round, but arithmetic does.
3. Arithmetic mnemonics (`fadd`, `fmul`, `fdiv`, `fsub`, `fsqrt`) must be zero. Record any remaining with their function.
4. Emit `excess_precision_findings`.

### Output
`excess_precision_findings`.

### Quality Gate
- `grep -cE "\bf(add|sub|mul|div|sqrt)[lps]*\b" port32.dis` prints `0`, or each hit is recorded as a finding.

---

## Worked Example

Illustrative.

```
$ gcc -O2 -m32 probe.c -o probe && ./probe
FLT_EVAL_METHOD=2
$ gcc -O2 -m32 -msse2 -mfpmath=sse probe.c -o probe && ./probe
FLT_EVAL_METHOD=0
$ objdump -d --no-show-raw-insn libport32.a | grep -cE "\bf(add|sub|mul|div|sqrt)[lps]*\b"
0
```

Finding: default 32-bit build used x87; `-msse2 -mfpmath=sse` fixes it and is appended to `fp_flags` by the build owner.

---

## Exit Criteria

DONE when every 32-bit configuration reports `FLT_EVAL_METHOD=0` and no x87 arithmetic remains, or the limit is recorded as an open question.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `-m32` build fails for missing multilib | **Retry**: install `gcc-multilib g++-multilib` (Debian or Ubuntu package names) and rebuild. |
| Phase 1 | Target CPU lacks SSE2 | **Return**: report that bit-exact parity is an open question on this target. |
| Phase 2 | x87 arithmetic remains in `long double` code | **Adjust**: `long double` is x87 by definition on i686; record it unless the contract says `float64`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
