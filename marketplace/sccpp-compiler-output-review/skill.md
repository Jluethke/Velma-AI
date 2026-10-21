# Compiler Output Review for Critical Functions

**One-line description:** Disassembles the release build of named critical functions with objdump and source interleaving to confirm that defensive checks, volatile register accesses and intended arithmetic survived optimization, that no unexpected library or runtime calls appear, and that floating-point flags match the project's assumptions.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `build_profiles` (object, required): From `sccpp-cmake-build-profiles`; the target profile and its exact release flags.
- `critical_functions` (string[], required): Function names whose machine code must be reviewed (for example the functions in a safety requirement's allocation list).
- `stack` (string, required): "gcc" or "clang"; selects objdump or llvm-objdump commands.

---

## Outputs

- `asm_review` (object): Per function: the disassembly listing path, the checklist results with the instruction addresses that prove each item, unexpected calls found, flag findings, and items needing a fix or an open question.

---

## Phase 1: Produce Listings From the Release Build

### Entry Criteria
- Target ELF built with the release flags and with debug info (`-g` does not change generated code in GCC or Clang; if the release build lacks `-g`, build an identical configuration that only adds `-g` and record that).

### Actions
1. Record the release flags from `build/target/compile_commands.json` for each file containing a critical function.
2. Flag check, from those flags:

| Flag present | Finding |
|---|---|
| `-ffast-math`, `-Ofast`, `-funsafe-math-optimizations` | Defect for safety-relevant floating point: IEEE semantics (NaN checks, ordering) are not kept |
| `-ffp-contract=fast` or no `-ffp-contract` with Clang | Fused multiply-add may change results between builds; record and decide with the project (`-ffp-contract=off` keeps separate rounding) |
| `-fno-strict-aliasing` missing while code type-puns through pointers | Record type-punning sites for review |
| `-fwrapv` present | Signed overflow defined as wrap; record, since code may rely on it |

3. Disassemble each function with source: GCC toolchain `arm-none-eabi-objdump -d -S -l --no-show-raw-insn --disassemble=<function> build/target/app.elf > build/asm/<function>.lst` (`--disassemble=<symbol>` needs binutils 2.32 or newer; otherwise disassemble all and cut the function). Clang toolchain: `llvm-objdump -d -S -l --no-show-raw-insn --disassemble-symbols=<mangled or C name> build/target/app.elf`. For C++ get mangled names with `nm build/target/app.elf | grep <name>`.
4. Optionally also produce compiler assembly with comments: `-S -fverbose-asm` on that one file with identical flags.

### Output
One listing per critical function, and the flag findings.

### Quality Gate
- Every name in `critical_functions` has a non-empty listing file.
- Listings came from the same ELF as the release build (compare `sha256sum` of the ELF used with the release artifact, or record that a `-g` twin was used).

---

## Phase 2: Review Against the Checklist

### Entry Criteria
- Listings exist.

### Actions
1. For each function, check and record the instruction address proving each item:
   - Each defensive check in source (range checks, null checks, plausibility checks) appears as a compare and branch. If it is missing, the compiler proved it redundant, often because of earlier undefined behavior or a dereference before the check. Find the reason in source.
   - Each `volatile` register read and write in source appears as a separate load or store, in source order, not merged or hoisted out of loops.
   - Loop bounds from source appear as compares against the expected constant or variable.
   - No calls to unexpected functions: list every `bl`/`call` target and compare with the source. Unexpected targets include `memcpy` or `memset` inserted for struct copies, soft-float helpers (`__aeabi_dadd`, `__aeabi_fmul` on targets meant to use the FPU), division helpers (`__aeabi_uidiv`), `malloc`, and `abort`.
   - Double precision instructions or helpers where the source intends single precision (often from an unsuffixed literal like `0.5` instead of `0.5f`).
2. Never conclude "reviewed" without listing addresses for each checklist item.

### Output
Checklist results per function.

### Quality Gate
- Every checklist item has an address or a "not present" finding.
- Every call target is listed with expected or unexpected.

---

## Phase 3: Resolve Findings

### Entry Criteria
- Checklist results exist.

### Actions
1. For a removed check: fix the source cause (remove the undefined behavior, move the null check before the dereference), rebuild, re-disassemble, confirm the compare and branch is present.
2. For an unexpected soft-float or double helper: fix literals and types, rebuild, confirm.
3. For a flag finding: report to the build owner; do not change release flags in this flow without the user's approval.
4. Emit `asm_review`.

### Output
`asm_review`.

### Quality Gate
- Each fixed item has a before and after address listing.
- Each unfixed item is listed as an open question with its owner.

---

## Worked Example

Illustrative only. `brake_lamp_diag_check` (lamp circuit diagnosis; the brake function itself is not in this software) on Cortex-M4F with GCC 13, `-O2 -mfpu=fpv4-sp-d16 -mfloat-abi=hard`.

```
$ arm-none-eabi-objdump -d -S --no-show-raw-insn --disassemble=brake_lamp_diag_check build/target/bcm.elf
  if (current_ma > (lamp_nominal_ma * 1.2))
 8002a14:  bl  8000c80 <__aeabi_f2d>
 8002a1c:  bl  8000d10 <__aeabi_dmul>
```

The unsuffixed `1.2` promotes to double, pulling in soft double helpers on a single-precision FPU. Changed to `1.2f` and compiled again: listing shows `vmul.f32` and `vcmp.f32`, no helper calls. Volatile read of `ADC1->DR` appears once per loop iteration at 0x8002a30.

---

## Exit Criteria

DONE when every critical function's release machine code was reviewed against the checklist with addresses, every removed check or unexpected call is fixed or open with an owner, and the flag findings are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Function was inlined and has no symbol | **Adjust**: review it inside each caller's listing, or record its callers; do not add `noinline` to the release build without approval. |
| Phase 1 | `--disassemble=` unsupported | **Adjust**: disassemble the whole ELF and extract the function by its symbol address from `nm`. |
| Phase 2 | Source and machine code order differ | **Adjust**: compare effect, not order, except for volatile accesses, which must keep order. |
| Phase 3 | Fix needs a release flag change | **Return**: report to the build owner with the evidence; flags change only with approval. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
