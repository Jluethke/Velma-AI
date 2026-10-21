# Parity GCC FP Contraction Check

**One-line description:** Proves a GCC-built port contains no fused multiply-add instructions the reference does not perform, by reading GCC's effective `-ffp-contract` setting and disassembling the object code for FMA mnemonics on x86_64 and aarch64.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `port_repo` (string, required): Path to the port built with GCC.
- `fp_flags` (string[], required): Output of `parity-fp-flag-baseline`.

---

## Outputs

- `contraction_findings` (object[]): Each function in the port binary that contains an FMA instruction, with the mnemonic, address, and whether the source uses `std::fma` on purpose.

---

## Phase 1: Read the Effective Setting

### Entry Criteria
- The port is built with GCC and `fp_flags` applied.

### Actions
1. Print GCC's effective value with the port's exact flags: `g++ <port flags> -Q --help=common | grep fp-contract`. The output line shows the value in effect (`off`, `on`, or `fast`).
2. If the output shows anything other than `off`, the flags did not take effect. Stop and fix the build before disassembling.
3. Why this matters: GCC documents `-ffp-contract=fast` as the default outside ISO C standard modes. On aarch64, FMA instructions are always available, so `a * b + c` becomes one `fmadd` with a single rounding instead of two. On x86_64 GCC only emits FMA when the target enables it (`-mfma`, or `-march=haswell`, `-march=x86-64-v3` or later), so the same source can match on a default x86_64 build and diverge on aarch64.

### Output
Effective contraction setting.

### Quality Gate
- The `--help=common` output line for `-ffp-contract=` reads `off`.

---

## Phase 2: Disassemble for FMA

### Entry Criteria
- Effective setting is `off`.

### Actions
1. Disassemble the port library or harness. x86_64: `objdump -d --no-show-raw-insn -C libport.a > port.dis`. aarch64 cross build: `aarch64-linux-gnu-objdump -d --no-show-raw-insn -C libport.a > port.dis`.
2. Search for FMA mnemonics. x86_64: `grep -nE "vfn?m(add|sub)[0-9]{3}[sp][sd]" port.dis`. aarch64 scalar and vector: `grep -nE "\bfn?m(add|sub)\b|\bfml[as]\b" port.dis`.
3. For each hit, find the enclosing function: the nearest preceding line of the form `<name>:` in `port.dis`.
4. For each function with a hit, check the source for an explicit `std::fma`, `fma(`, or `__builtin_fma`. An explicit call is intended only if the reference also uses a fused operation at that point (Python `math.fma`, added in Python 3.13). If the reference does not, record it as a mismatch.
5. Emit `contraction_findings`. An empty list is the passing result.

### Output
`contraction_findings`.

### Quality Gate
- `grep` from step 2 was run on the full disassembly, not on selected functions.
- Every hit in `contraction_findings` names its function and whether an explicit fused call explains it.

---

## Worked Example

Illustrative, aarch64 build before the fix.

```
$ g++ -O2 -std=c++20 -Q --help=common | grep fp-contract
  -ffp-contract=[off|on|fast]           fast
$ aarch64-linux-gnu-objdump -d --no-show-raw-insn -C liblp.a | grep -nE "\bfn?m(add|sub)\b"
41:     fmadd   d0, d1, d2, d0
```

Line 41 sits in `lp::step(double, std::array<double,2>&)`; the source has `y = b0 * x + s[0];` and no `std::fma`. After adding `-ffp-contract=off`, the first command prints `off` and the grep returns nothing.

---

## Exit Criteria

DONE when GCC reports `off` with the port's flags and the full disassembly contains no unexplained FMA instruction.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Setting reads `fast` despite the flag | **Adjust**: a later flag or a `#pragma GCC optimize` overrides it; check compile line order and source pragmas. |
| Phase 2 | FMA appears only inside libm or libstdc++ functions | **Adjust**: record it under the library, not the port; route to `parity-libm-divergence`. |
| Phase 2 | Weak model rewrites math to dodge the grep | **Stop**: fix contraction with the flag or a documented pragma, never by obfuscating expressions. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
