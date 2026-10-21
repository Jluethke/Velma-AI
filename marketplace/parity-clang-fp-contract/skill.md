# Parity Clang FP Contraction Check

**One-line description:** Proves a Clang-built port has no unintended fused multiply-add, accounting for Clang's default of fusing within a statement, its `#pragma clang fp contract` and `#pragma STDC FP_CONTRACT` controls, and the `fast` versus `fast-honor-pragmas` modes.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `port_repo` (string, required): Path to the port built with Clang or Apple Clang.
- `fp_flags` (string[], required): Output of `parity-fp-flag-baseline`.

---

## Outputs

- `contraction_findings` (object[]): Each function containing an FMA instruction, with mnemonic, the pragma or flag in effect, and whether the source asks for fusion on purpose.

---

## Phase 1: Check Flags and Pragmas

### Entry Criteria
- The port is built with Clang and `fp_flags` applied.

### Actions
1. Confirm the flag reached the compiler's internal invocation: `clang++ <port flags> -### -c src/x.cpp 2>&1 | tr ' ' '\n' | grep ffp-contract`. Clang's documented default for C and C++ is `on`, which fuses `a * b + c` within one statement when the target has FMA. The output must show `-ffp-contract=off`.
2. Search for pragmas that override the flag locally: `grep -rnE "#pragma (clang fp contract|STDC FP_CONTRACT)" <port_repo>`. `#pragma clang fp contract(fast)` or `#pragma STDC FP_CONTRACT ON` re-enables fusion in its scope even when the flag is `off`.
3. Know the mode semantics from the Clang manual: `fast` fuses across statements and ignores pragmas; `fast-honor-pragmas` fuses across statements but honors pragmas; `on` fuses within a statement and honors pragmas; `off` never fuses.
4. Apple Clang on Apple silicon targets aarch64, where FMA is always present, so the default `on` fuses there. Treat Apple Clang as Clang for this flow.

### Output
Effective contraction mode per TU and a pragma list.

### Quality Gate
- Step 1 output shows `-ffp-contract=off` for every port TU checked.
- Every pragma hit from step 2 is listed with file and line.

---

## Phase 2: Disassemble for FMA

### Entry Criteria
- Flag confirmed.

### Actions
1. Disassemble with the LLVM tool so it matches the compiler: `llvm-objdump -d --no-show-raw-insn -C libport.a > port.dis` (on macOS `objdump` is LLVM objdump).
2. Search. x86_64: `grep -nE "vfn?m(add|sub)[0-9]{3}[sp][sd]" port.dis`. aarch64: `grep -nE "\bfn?m(add|sub)\b|\bfml[as]\b" port.dis`.
3. Map each hit to its function (nearest preceding `<name>:` line), then to source with `llvm-addr2line -e libport.so -f -C <address>` on a build with `-g`.
4. If the source line is inside a pragma scope from Phase 1 or is an explicit `std::fma`, mark it intended only if the reference fuses there too; otherwise record a mismatch.
5. Emit `contraction_findings`.

### Output
`contraction_findings`.

### Quality Gate
- The grep ran on the full disassembly.
- Every hit is mapped to a source line or marked as inside a library function.

---

## Worked Example

Illustrative, macOS on Apple silicon.

```
$ clang++ -O2 -std=c++20 -### -c src/lp.cpp 2>&1 | tr ' ' '\n' | grep ffp-contract
"-ffp-contract=on"
$ objdump -d --no-show-raw-insn -C build/liblp.a | grep -nE "\bfmadd\b"
57:     fmadd   d0, d8, d1, d0
```

The default `on` fused `y = b0 * x + s[0]`. After adding `-ffp-contract=off`, the first command prints `"-ffp-contract=off"` and the grep returns nothing.

---

## Exit Criteria

DONE when every port TU compiles with `-ffp-contract=off`, every contraction pragma is accounted for, and the disassembly has no unexplained FMA.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A header-only dependency sets `#pragma clang fp contract(fast)` | **Return**: report it; the pragma applies to the port's TUs that include it. |
| Phase 2 | No `llvm-addr2line` available | **Adjust**: rebuild with `-g` and use `addr2line` from binutils or `atos` on macOS. |
| Phase 2 | Hits only inside `libm` symbols | **Adjust**: route to `parity-libm-divergence`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
